import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';

import { useI18n } from '../i18n';

/**
 * Hộp thoại nhập mật khẩu của tệp.
 *
 * Mật khẩu chỉ tồn tại trong bộ nhớ tới khi tác vụ kết thúc, không được lưu
 * xuống đĩa (SECURITY-PRIVACY.md mục 4).
 */
const useStyles = makeStyles({
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  hint: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

export interface PasswordPromptProps {
  /** Hộp thoại có mở hay không. */
  open: boolean;
  /** Tên tệp cần mật khẩu. */
  fileName: string;
  /** Gọi khi người dùng nhập mật khẩu. */
  onSubmit: (password: string) => void;
  /** Gọi khi người dùng bỏ qua. */
  onCancel: () => void;
  /** Nội dung nút chính. */
  submitLabel: string;
}

export function PasswordPrompt({
  open,
  fileName,
  onSubmit,
  onCancel,
  submitLabel,
}: PasswordPromptProps): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();
  const [password, setPassword] = useState('');

  return (
    <Dialog
      open={open}
      onOpenChange={(_event, data) => {
        if (!data.open) {
          // Xóa mật khẩu cũ khi đóng, để không còn trong bộ nhớ.
          setPassword('');
          onCancel();
        }
      }}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{t('password.title')}</DialogTitle>
          <DialogContent>
            <Text>{t('password.description', { file: fileName })}</Text>
            <div className={styles.field}>
              <Field label={t('password.label')} required>
                <Input
                  type="password"
                  value={password}
                  onChange={(_event, data) => setPassword(data.value)}
                  data-testid="password-input"
                />
              </Field>
              <span className={styles.hint}>{t('password.hint')}</span>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onCancel}>
              {t('common.cancel')}
            </Button>            <Button
              appearance="primary"
              disabled={password.length === 0}
              onClick={() => onSubmit(password)}
              data-testid="password-submit"
            >
              {submitLabel}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
