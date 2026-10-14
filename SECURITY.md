# Security / Güvenlik

Do not post tokens, environment files, personal data or spoiler bodies in issues or logs. For a vulnerability, use the repository's private vulnerability reporting feature if available. If unavailable, open a minimal issue asking for a private contact without exploit details. Never send a token to maintainers.

Issue veya loglarda token, ortam dosyası, kişisel veri veya spoiler metni paylaşmayın. Açık bildiriminde varsa deponun özel güvenlik bildirimi özelliğini kullanın. Yoksa saldırı ayrıntılarını yazmadan özel iletişim talep eden kısa bir issue açın. Bakım yapanlara token göndermeyin.

SpoilerLeaf is an opt-in presentation tool, not a secret vault or a content moderation system. Any channel member can reveal a card and copy the text. Discord and the operator can access processed data. No encryption-at-rest or guaranteed forensic erasure is provided. A compromised bot token must be reset in the Discord Developer Portal; remove exposed copies and restart with the new token.

SpoilerLeaf isteğe bağlı bir sunum aracıdır; gizli kasa veya içerik denetimi sistemi değildir. Kanalı gören her üye kartı açıp metni kopyalayabilir. Discord ve işletmeci işlenen verilere erişebilir. Disk şifreleme veya adli açıdan kesin silme garantisi yoktur. Sızan bot tokenını Developer Portal üzerinden sıfırlayın; açığa çıkan kopyaları kaldırıp yeni tokenla yeniden başlatın.

Use a dedicated application for one server, Guilds intent only, View Channel + Send Messages only, and keep dependencies current after reviewing changelogs and running checks. Never grant Administrator to solve setup problems. CI runs with read-only repository permissions, without Discord credentials, and dependencies install with lifecycle scripts disabled.
