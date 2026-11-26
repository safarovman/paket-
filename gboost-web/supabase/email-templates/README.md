# Email shablonlari (UzDrop nomidan, kod bilan)

Supabase → **Authentication** → **Emails** → **Templates**:

| Shablon | Subject (Mavzu) | Message body |
|---|---|---|
| **Confirm sign up** | `UzDrop — tasdiqlash kodi: {{ .Token }}` | `confirm_signup.html` ichidagi hammasi |
| **Magic Link** | `UzDrop — kirish kodi: {{ .Token }}` | `magic_link.html` ichidagi hammasi |

Xat **UzDrop** nomidan kelishi uchun Custom SMTP (Gmail) yoqilgan bo'lishi kerak — `QADAMLAR.md`.
