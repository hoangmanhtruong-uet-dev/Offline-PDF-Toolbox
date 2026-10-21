using System;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Windows.Services.Store;

namespace StoreBridge;

public class CommandRequest
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("cmd")]
    public string Cmd { get; set; } = string.Empty;

    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;
}

public class CommandResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("ok")]
    public bool Ok { get; set; }

    [JsonPropertyName("isPro")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? IsPro { get; set; }

    [JsonPropertyName("licenseState")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? LicenseState { get; set; }

    [JsonPropertyName("status")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Status { get; set; }

    [JsonPropertyName("errorCode")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ErrorCode { get; set; }

    [JsonPropertyName("message")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Message { get; set; }
}

public static class Program
{
    private static StoreContext? _storeContext;

    private static StoreContext GetContext()
    {
        return _storeContext ??= StoreContext.GetDefault();
    }

    public static async Task Main(string[] args)
    {
        // Giao tiếp qua JSON trên stdin/stdout (docs/LICENSING.md mục 4)
        while (true)
        {
            var line = await Console.In.ReadLineAsync();
            if (line == null) break;
            line = line.Trim();
            if (string.IsNullOrEmpty(line)) continue;

            CommandRequest? req = null;
            try
            {
                req = JsonSerializer.Deserialize<CommandRequest>(line);
            }
            catch (Exception ex)
            {
                Send(new CommandResponse
                {
                    Id = "unknown",
                    Ok = false,
                    ErrorCode = "E_INVALID_JSON",
                    Message = ex.Message
                });
                continue;
            }

            if (req == null) continue;

            try
            {
                switch (req.Cmd)
                {
                    case "getLicense":
                    case "restore":
                        await HandleGetLicense(req);
                        break;
                    case "purchase":
                        await HandlePurchase(req);
                        break;
                    case "ping":
                        Send(new CommandResponse { Id = req.Id, Ok = true, Message = "pong" });
                        break;
                    default:
                        Send(new CommandResponse
                        {
                            Id = req.Id,
                            Ok = false,
                            ErrorCode = "E_UNKNOWN_COMMAND",
                            Message = $"Lenh khong xac dinh: {req.Cmd}"
                        });
                        break;
                }
            }
            catch (Exception ex)
            {
                Send(new CommandResponse
                {
                    Id = req.Id,
                    Ok = false,
                    ErrorCode = "E_STORE_ERROR",
                    Message = ex.Message
                });
            }
        }
    }

    private static async Task HandleGetLicense(CommandRequest req)
    {
        try
        {
            var context = GetContext();
            var appLicense = await context.GetAppLicenseAsync();

            bool isPro = false;
            string state = "inactive";

            if (appLicense != null)
            {
                if (string.IsNullOrEmpty(req.ProductId))
                {
                    // Nếu không truyền productId, kiểm tra xem có bất kỳ add-on nào active không
                    foreach (var addon in appLicense.AddOnLicenses)
                    {
                        if (addon.Value.IsActive)
                        {
                            isPro = true;
                            state = "active";
                            break;
                        }
                    }
                }
                else if (appLicense.AddOnLicenses.TryGetValue(req.ProductId, out var addonLicense))
                {
                    isPro = addonLicense.IsActive;
                    state = isPro ? "active" : "inactive";
                }
            }

            Send(new CommandResponse
            {
                Id = req.Id,
                Ok = true,
                IsPro = isPro,
                LicenseState = state
            });
        }
        catch (Exception ex)
        {
            Send(new CommandResponse
            {
                Id = req.Id,
                Ok = false,
                ErrorCode = "E_STORE_UNAVAILABLE",
                Message = ex.Message
            });
        }
    }

    private static async Task HandlePurchase(CommandRequest req)
    {
        if (string.IsNullOrEmpty(req.ProductId))
        {
            Send(new CommandResponse
            {
                Id = req.Id,
                Ok = false,
                ErrorCode = "E_INVALID_PRODUCT_ID",
                Message = "Yeu cau truyen ProductId"
            });
            return;
        }

        try
        {
            var context = GetContext();
            var result = await context.RequestPurchaseAsync(req.ProductId);

            switch (result.Status)
            {
                case StorePurchaseStatus.Succeeded:
                    Send(new CommandResponse
                    {
                        Id = req.Id,
                        Ok = true,
                        Status = "completed",
                        IsPro = true
                    });
                    break;
                case StorePurchaseStatus.AlreadyPurchased:
                    Send(new CommandResponse
                    {
                        Id = req.Id,
                        Ok = true,
                        Status = "alreadyPurchased",
                        IsPro = true
                    });
                    break;
                case StorePurchaseStatus.NotPurchased:
                    Send(new CommandResponse
                    {
                        Id = req.Id,
                        Ok = true,
                        Status = "cancelled",
                        IsPro = false
                    });
                    break;
                default:
                    Send(new CommandResponse
                    {
                        Id = req.Id,
                        Ok = false,
                        ErrorCode = "E_PURCHASE_FAILED",
                        Message = result.ExtendedError?.Message ?? "Giao dich mua khong thanh cong"
                    });
                    break;
            }
        }
        catch (Exception ex)
        {
            Send(new CommandResponse
            {
                Id = req.Id,
                Ok = false,
                ErrorCode = "E_STORE_UNAVAILABLE",
                Message = ex.Message
            });
        }
    }

    private static void Send(CommandResponse res)
    {
        var json = JsonSerializer.Serialize(res);
        Console.Out.WriteLine(json);
        Console.Out.Flush();
    }
}
