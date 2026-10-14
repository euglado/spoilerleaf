# Contributing / Katkı

Discuss a small reproducible issue before a large change. Use Node.js 24 LTS. Run `npm ci --ignore-scripts`, `npm run check` and `npm audit --audit-level=low` in a clean checkout without `.env`. Tests must use fake Discord interactions and must not contact Discord or need credentials. Add behavior tests for permission, leakage, expiry or concurrency changes. Keep documentation in Turkish and English consistent. Do not introduce reader histories, message-reading intents, tracking, DMs or external content fetching without an explicit design discussion.

Büyük değişiklikten önce küçük, tekrarlanabilir bir issue ile tartışın. Node.js 24 LTS kullanın. `.env` bulunmayan temiz bir kopyada `npm ci --ignore-scripts`, `npm run check` ve `npm audit --audit-level=low` çalıştırın. Testler sahte Discord etkileşimleri kullanmalı; Discord'a bağlanmamalı veya kimlik bilgisi istememeli. Yetki, sızıntı, süre dolumu ve eşzamanlılık değişikliklerini davranış testleriyle doğrulayın. Türkçe ve İngilizce belgeleri tutarlı güncelleyin. Tasarım tartışması olmadan okuyucu geçmişi, mesaj okuma intent'i, izleme, DM veya dış içerik çekme eklemeyin.

Use short commit titles that describe the actual change. Contributions are under MIT; make no unsupported authorship or security claims. Report security concerns using SECURITY.md, not a public exploit report.
