# SpoilerLeaf

**Türkçe:** Kitap, oyun ve etkinlik toplulukları için isteğe bağlı spoiler kartları. Yönetici metni özel olarak önizler; kanala yalnızca başlık, uyarı ve düğmeler gönderilir. Üye **Spoilerı göster** düğmesine basarsa metin yalnızca o üyeye özel Discord yanıtında açılır.

**English:** Opt-in spoiler cards for book, game and event communities. A manager privately previews the text; only a title, warning and buttons appear in the channel. Members deliberately press **Reveal spoiler** to receive the text in an ephemeral reply visible to themselves.

[Türkçe kurulum](#türkçe) · [English setup](#english) · [Security](SECURITY.md) · [Contributing](CONTRIBUTING.md) · [MIT](LICENSE)

## Türkçe

### Amaç ve özellikler

SpoilerLeaf, aynı sunucuda henüz kitabı bitirmeyenlerle spoiler konuşmak isteyenlerin bir arada bulunmasını kolaylaştırır. Gerçek bir Discord Gateway botudur; GitHub Actions yalnızca kodu sınar. `/spoilerleaf` komutu form açar. Yalnızca **Sunucuyu Yönet** yetkili kişiler kart oluşturabilir veya kapatabilir. Üyeler karttaki düğmeyle izinlerini kendileri verir; okuyanların listesi veya sayacı tutulmaz.

- Güncel Discord Label bileşenleriyle üç alanlı form; açık başlık/uyarı ve özel açılacak metin açıkça ayrılır.
- Özel önizleme, **Yayımla** ve **Vazgeç** düğmeleri; yayımlama öncesinde insan incelemesi.
- Açık karttan **Spoilerı göster** ile yalnızca tıklayan üyeye özel yanıt. Metin, mention ve bağlantı önizlemesi oluşturmayacak şekilde gönderilir.
- Yönetici **Kapat**, ardından özel onayda **Sil ve kapat** seçer. Bot kendi geçici kaydını kaldırır ve kendi açık kartını güncellemeye çalışır.
- Arayüz kısa Türkçe/İngilizce etiketler kullanır. Metin simge veya renge bağımlı değildir; mobil ve ekran okuyucu deneyimi canlı ortamda doğrulanmalıdır.

Bot mesaj geçmişini okumaz, DMs göndermez, ses kanallarına bağlanmaz, rol/kanal yönetmez, üye listesini çekmez, okuyucu analitiği tutmaz ve dış bağlantı açmaz. Otomatik içerik denetimi yapmaz. Yönetici telif, topluluk ve Discord kurallarına uygun metin girmelidir. Hassas sırlar, parolalar veya kişisel bilgiler için kullanmayın. Spoiler kartı, kanala erişebilen herkese isteğe bağlı olarak açıktır.

### Gereksinimler

Node.js **24 LTS**, npm (Node ile gelir), internet bağlantısı, Discord sunucusu ve o sunucuya uygulama kurabilme yetkisi gerekir. Bu sürüm Node 24.13.1 ile sınanır. Tek bot süreci tek yapılandırılmış sunucuya hizmet verir. Kullanıcılar Discord istemcisinde uygulama komutlarını kullanabilmelidir; kartları okuyacak kanala erişmeleri gerekir. Hazır barındırma veya ortak bot tokenı sağlanmaz.

### Baştan sona kurulum

1. [Node.js](https://nodejs.org/) sitesinden 24 LTS sürümünü kurun. Açık terminalleri kapatıp yeniden açın.
2. Bu deponun **Code → Download ZIP** seçeneğiyle kaynakları indirin ve ZIP'i kişisel bir klasöre çıkartın. OneDrive veya ortak/senkronize klasörde token saklamaktan kaçının. Git bilenler `git clone https://github.com/euglado/spoilerleaf.git` kullanabilir.
3. [Discord Developer Portal](https://discord.com/developers/applications) üzerinde **New Application** ile yalnızca bu bot için bir uygulama oluşturun. **General Information → Application ID** değerini kopyalayın. Bu değer token değildir.
4. **Bot** sayfasından gerekirse botu oluşturun, **Reset Token** ile token alın. Token bir paroladır: GitHub, issue, ekran görüntüsü veya sohbette paylaşmayın. İstemediğiniz sunuculara kurulmasını önlemek için uygun olduğunda **Public Bot** seçeneğini kapatın. **Presence Intent**, **Server Members Intent** ve **Message Content Intent** seçenekleri kapalı kalsın.
5. **Installation** bölümünde yalnızca **Guild Install** seçin. Varsayılan kurulum scopes: `bot` ve `applications.commands`. Bot izinleri yalnızca **View Channels / Kanalı Görüntüle** ve **Send Messages / Mesaj Gönder** olsun (izin sayısı `3072`). **Administrator** vermeyin. Portalın oluşturduğu Install Link ile doğru sunucuya ekleyin. Kanal özel ise yalnızca hedef kanalda bota bu iki izni verin. Kullanıcıların kanal erişimini ayrıca yönetin.
6. Discord **User Settings → Advanced → Developer Mode** açın. Sunucu simgesine sağ tıklayıp **Copy Server ID** seçin. Kanal kimliği veya uygulama kimliği ile karıştırmayın.
7. **Windows:** çıkartılan klasörde `setup.cmd` dosyasını çift tıklayın. **macOS/Linux:** klasörde Terminal açıp `bash setup.sh` çalıştırın. Yardımcılar kilitli bağımlılıkları kurar, kodu derler, Application ID ve Server ID sorar, tokenı **ekranda göstermeden** alır ve komutu sunucunuza kaydeder. Kaynak kodunu düzenlemeniz gerekmez. `.env` varsa üzerine yazılmaz.
8. **Windows:** `start.cmd` çift tıklayın. **macOS/Linux:** `bash start.sh`. Bağlandı mesajını görün; Discord'da normal metin kanalında `/spoilerleaf` kullanın. Bu terminal açık kalmalıdır.

Yardımcısız terminal kurulumu, aynı klasörden sırayla:

```sh
npm ci --ignore-scripts
npm run build
npm run setup
npm run register
npm start
```

Kurulum hatasından sonra tokenı tekrar göndermeyin. `.env` oluşturulduysa ve yalnızca komut kaydı başarısız olduysa `npm run register` komutunu tekrar çalıştırın. Yeniden yapılandırma için botu durdurun, mevcut `.env` dosyasını bilgisayarınızda güvenli bir yere yeniden adlandırın ve `npm run setup` ardından `npm run register` çalıştırın. Eski dosyayı gizli tutun; depoya eklemeyin. Kaynak kod düzenlemek gerekmez. Token sızarsa önce Portal'da **Reset Token** yapın.

### Yapılandırma

`npm run setup`, yerel `.env` dosyasına `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID` ve `DISCORD_GUILD_ID` değerlerini yazar. Token gizlidir, diğer iki değer sayısal kimliktir. `.env.example` boş alanları belgeler; gerçek dosya Git tarafından yok sayılır. Kurulum POSIX sistemlerde dosyayı yalnızca sahibi okuyacak modla oluşturur; Windows'ta hesap ve klasör erişim izinlerinizi ayrıca koruyun. Barındırma sağlayıcınızda aynı üç ortam değişkenini gizli ayarlar olarak tanımlayabilirsiniz; CI'ye token eklemeyin. Tek sunucu ve tek süreç kullanın; aynı uygulama için birden fazla kopya çalıştırmayın.

### Kullanım örneği

Yönetici `/spoilerleaf` çalıştırır. Açık başlık: “Kitap kulübü — 5. bölüm”. Açık uyarı: “Bölüm sonunu açıklar”. Özel metin: paylaşmak istediğiniz **kısa** spoiler. Formu gönderin; özel önizlemede açık alanların spoilerı ele vermediğini kontrol edin. **Yayımla** seçin. Üyeler uyarıyı okuyup isterlerse **Spoilerı göster** seçer. Yanıt kanala gönderilmez. Üye özel yanıtı Discord'da kapatabilir; metni kopyalaması engellenmez.

Kartı kapatmak için o kartta **Close / Kapat (manager)** ve özel onayda **Sil ve kapat** seçin. Başka bir yöneticinin kartını da kapatabilirsiniz. Yetki her yönetici işleminde yeniden kontrol edilir. **Açık tut** yalnızca onayı iptal eder. Kapatma, önceden açılmış özel yanıtlardan metin geri çekmez. Bot açık kartı düzenleyemezse geçici kayıt yine kaldırılır; bir yönetici eski açık kartı elle silmelidir.

### İzinler, güvenlik ve gizlilik

Bot yalnızca **Guilds** Gateway intent'i ve hedef kanalda **View Channel + Send Messages** kullanır. Read Message History, Manage Messages, Embed Links, rol yönetimi ve ayrıcalıklı intent'ler gerekli değildir. Komut **Manage Server / Sunucuyu Yönet** üyelerine görünür; çalışma zamanında form, yayımlama, kapatma ve onayda tekrar kontrol edilir. Reveal için bu yönetici izni gerekmez. Komut kaydı yalnızca `/spoilerleaf` komutunu ekler/günceller; başka komutları topluca silmez.

Geçici RAM verisi: taslak sahibinin Discord ID'si, sunucu/kanal ID'leri, yazdığı üç metin ve rastgele denetim kimlikleri; yayımlanmış kartta metinler, sunucu/kanal/mesaj ID'si ve sona erme zamanı. Taslak/form/onaylar 10 dakikada, kartlar yayımlandıktan 2 saatte sona erer. 30 saniyelik temizlik ve her işlemdeki süre kontrolü eski kayıtları kaldırır. Okuyucu listesi yoktur; spam sınırlaması için kullanıcı ID'siyle son 2 saniyelik gösterim veya 10 saniyelik form limiti tutulur, sonra kaldırılır. İçerik, token ve ham API hataları loglanmaz. Veritabanı, telemetry, analytics veya dış servis yoktur; Discord'a gerekli API/Gateway trafiği gönderilir.

“Özel yanıt” şifreli kasa demek değildir. Discord ve bot işletmecisi veriyi işleyebilir; kanalı gören üyeler düğmeye basıp metni kopyalayabilir. Başlık ve uyarı bilerek **herkese açıktır**. Discord'da gönderilmiş açık kartlar ve özel yanıtlar, botun RAM kaydı sona erse bile Discord'un saklama kurallarına göre kalabilir. Güvenilir adli silme, disk/swap şifreleme veya ekran görüntüsü engelleme garantisi verilmez. Ayrıntılar [SECURITY.md](SECURITY.md) dosyasındadır.

### Sınırlar ve botu çalışır tutma

Başlık en fazla 60, tek satırlık uyarı 120, spoiler metni 600 UTF-16 karakter birimi olabilir; emoji birden çok birim sayılabilir. Kısa topluluk açıklamaları içindir; uzun eser metinlerini paylaşmayın. Aynı anda en fazla 10 açık kart, 50 geçici form/önizleme/onay ve 2000 kısa hız-limit kaydı vardır. Dakikada bir yayımlama yapılır; aynı anda bir yayımlama işlenir. Başarısız veya limitle reddedilen yayımlamanın önizlemesi yeniden kullanılamaz; tekrar form doldurun. Ağ belirsizliğinde kanalı kontrol edin: bot tekrar göndererek kopya üretmez, fakat gönderim gerçekleşip yanıt alınamadıysa işlevsiz bir kart kalabilir.

Bilgisayar kapanır, uykuya girer, terminal kapanır veya süreç yeniden başlarsa bot durur ve RAM içeriği kaybolur. Açık kartlar kendiliğinden silinmez; eski düğmeler “kullanılamıyor” yanıtı verir. Eski kartları elle temizleyip yeniden oluşturun. Barındırmak için sürekli çalışan tek bir Node 24 süreci, ağ bağlantısı ve bu klasörde `npm start` çalıştıran güvenilir servis yöneticisi gerekir. İlk kurulum/kayıt yalnızca gerektiğinde yapılır; her yeniden başlatmada token üretmeyin. Tokenı servis loglarına veya komut satırına yazmayın. Bu depo hazır üretim servisi kurmaz.

### Sorun giderme

- `node`/`npm` bulunamıyor: Node 24 LTS kurup terminali yeniden açın. Eski Node sürümü kullanmayın.
- `/spoilerleaf` yok: doğru sunucu/Application ID, Guild Install, `applications.commands` scope ve `npm run register` sonucunu kontrol edin. İstemciyi yenileyin. Üyenin Sunucuyu Yönet yetkisi olmalı; komut kullanıcı DM'lerinde çalışmaz.
- Kanal hatası: yalnızca normal sunucu metin kanalı desteklenir; thread, forum, ses ve DM desteklenmez. Bot ve üyenin hedef kanala erişimini, botun Mesaj Gönder iznini kontrol edin. Administrator vermeyin.
- `.env` mevcut: yardımcı kasıtlı olarak üzerine yazmaz. Yeniden yapılandırma adımlarını izleyin veya yalnızca başarısız komut kaydını yineleyin.
- Özel mesaj gelmiyor: bunlar DM değildir; aynı kanalda yalnızca sizin gördüğünüz interaction yanıtlarıdır. İstemciyi güncelleyin ve bağlantıyı kontrol edin.
- Süresi doldu / kart kapalı: 2 saat geçti, yönetici kapattı veya bot yeniden başladı. Kartı yeniden oluşturun.
- Meşgul / bekleyin: gösterim için 2 saniye, yeni form için 10 saniye, yayımlama için 1 dakika bekleyin. On kart sınırında eski kartı kapatın.
- Ağ/API hatası: güvenli genel hata gösterilir. Tokenı loglamadan bağlantıyı ve izinleri kontrol edin. Başarısız yayımlamadan sonra kanalı kontrol edip yeni önizleme oluşturun; eski düğmeye körlemesine basmayın.
- Kaynak kontrolü `.env` nedeniyle durdu: testleri token içermeyen temiz bir checkout'ta çalıştırın; sır kontrolünü kapatmayın.

### Testler, katkı ve lisans

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
node --check scripts/setup.mjs
node --check scripts/check-supply.mjs
bash -n setup.sh start.sh
```

`check`: Biome önerilen statik kuralları ve biçim kontrolü, strict TypeScript derlemesi, Node davranış testleri, kilitli bağımlılık lisans/registry/SHA-512/install-script incelemesi ve kaynakta kimlik bilgisi kalıp taraması. Kalıp taraması tüm sırları bulma garantisi vermez. CI Ubuntu, Windows ve macOS Intel üzerinde aynı kontrolleri ve temiz Git diff kontrolünü çalıştırır; actions commit SHA ile sabitlenir, izinler salt okunurdur. Yerelde Bash yoksa shell sözdizimi CI'de kontrol edilir.

Testler sahte Discord etkileşimleri kullanır. Gerçek token, canlı sunucu, etkileşimli gizli token girişi veya ekran okuyucu doğrulaması içermez. Yayın başarılı olsa da canlı kullanım için sizin kurulumunuz ve çalışan süreciniz gerekir. Önce bir deneme kanalında insan incelemesiyle deneyin. VDS gerektiren test yoktur. Katkı: [CONTRIBUTING.md](CONTRIBUTING.md). Lisans: [MIT](LICENSE).

## English

### Purpose and features

SpoilerLeaf lets people who finished a book, game or event share short spoilers while giving other channel members a choice. It is a real Discord Gateway bot. GitHub Actions only tests the source; it does not host the bot. `/spoilerleaf` opens a form available to members with **Manage Server**. A manager reviews the private preview and explicitly publishes. The channel receives only the public title, warning, expiry and buttons. Anyone with access to that channel can deliberately reveal the text in their own ephemeral reply. No reader roster or analytics is collected.

The current Discord Label modal separates public and private fields. Publish/Cancel and confirmed Close controls make actions explicit. Mentions and link previews are suppressed, and user Markdown is escaped. Short bilingual labels work without relying on icons or color; mobile and screen-reader behavior still needs live operator validation.

The bot does not read channel history, send DMs, join voice, fetch member lists, manage roles/channels, fetch links or moderate submitted text automatically. Managers must review content for community rules, copyright and Discord policies. Do not submit passwords, secrets or personal data. A spoiler card is available by choice to **every member who can access its channel**.

### Requirements

Install **Node.js 24 LTS** and its bundled npm. This version is checked with Node 24.13.1. You need internet access, a Discord server, permission to install an application there, your own application credentials and one always-on process. One configured server per process/application is supported. Members need channel access and the ability to use application commands. Hosting and a shared bot token are not included.

### Complete installation

1. Install Node.js 24 LTS from [nodejs.org](https://nodejs.org/), then reopen terminals.
2. Download this repository with **Code → Download ZIP**, and extract it into a private local folder. Avoid shared or synchronized folders for credentials. Git users can run `git clone https://github.com/euglado/spoilerleaf.git`.
3. In the [Discord Developer Portal](https://discord.com/developers/applications), create a dedicated application with **New Application**. Copy **General Information → Application ID**; this is not the token.
4. In **Bot**, create the bot if needed and use **Reset Token** to obtain its token. Treat it as a password. Never share it in issues, screenshots, chats or GitHub. Disable **Public Bot** when appropriate to restrict installations. Leave **Presence Intent**, **Server Members Intent** and **Message Content Intent** disabled.
5. In **Installation**, enable only **Guild Install**. Default scopes are `bot` and `applications.commands`; bot permissions are only **View Channels** and **Send Messages** (permission integer `3072`). Never grant Administrator. Use the generated Install Link to add the app to your server. For a restricted channel, explicitly allow the bot these two permissions there; manage member channel access separately.
6. Enable Discord **User Settings → Advanced → Developer Mode**. Right-click the server icon and choose **Copy Server ID**. Do not confuse it with a channel or application ID.
7. **Windows:** double-click `setup.cmd` in the extracted folder. **macOS/Linux:** open Terminal there and run `bash setup.sh`. The helper installs locked dependencies, compiles, asks for Application ID and Server ID, accepts the token **without displaying it**, and registers the command in that server. No source editing is needed. Existing `.env` files are never overwritten.
8. **Windows:** double-click `start.cmd`. **macOS/Linux:** run `bash start.sh`. Wait for the connected message and use `/spoilerleaf` in a normal server text channel. Keep the terminal open.

Manual alternative, sequentially in the project folder:

```sh
npm ci --ignore-scripts
npm run build
npm run setup
npm run register
npm start
```

If `.env` was created and only registration failed, rerun `npm run register`; do not resubmit the token. To reconfigure, stop the bot, safely rename the existing local `.env`, then run `npm run setup` and `npm run register`. Keep the old file secret and outside Git. No source changes are required. Reset a leaked token in the Portal first.

### Configuration

Setup writes three local environment variables: secret `DISCORD_TOKEN`, numeric `DISCORD_APPLICATION_ID`, and numeric `DISCORD_GUILD_ID`. `.env.example` documents empty fields; `.env` and its variants are Git-ignored. The helper requests owner-only file mode on POSIX; protect Windows account/folder ACLs separately. A host can supply these variables through its secret configuration instead. Do not put a Discord token in CI. Run only one process for the dedicated application and server.

### Usage

A manager runs `/spoilerleaf`, enters a public title such as “Book club — chapter 5”, a public warning such as “Reveals the ending”, and a short private spoiler. Submit and review the private preview, especially the public fields. Click **Publish**. Members can read the warning and choose **Reveal spoiler**. The spoiler goes to an ephemeral interaction reply, not a channel message or DM. Members can dismiss that reply or copy its text.

A manager closes any card by pressing **Close (manager)** then **Erase and close** in the private confirmation. **Keep open** cancels only that confirmation. Permissions are checked on every manager action including final confirmation. The bot drops its stored card before attempting to edit the public message. If that edit fails, the text remains unavailable through the bot and the confirmation asks for manual card deletion. Previously revealed Discord replies are not recalled.

### Permissions, security and privacy

The only Gateway intent is **Guilds**. The only bot channel permissions are **View Channel + Send Messages**. Read Message History, Manage Messages, Embed Links, privileged intents and Administrator are unnecessary. The slash command defaults to Manage Server; form, publication, closure and confirmation enforce it again at runtime. Readers do not need Manage Server. Registration upserts only `/spoilerleaf`, preserving any other commands.

Temporary RAM contains draft owner's user ID, guild/channel IDs, the submitted texts and random control IDs. Published cards contain the three texts, guild/channel/message IDs and expiry. Forms/previews/confirmations expire after 10 minutes; cards expire 2 hours after publication. Every action checks expiry and a 30-second sweep releases expired references. There is no reader roster; spam limits temporarily key user IDs for 2-second reveal and 10-second form cooldowns, then remove them. The bot never logs submitted text, tokens, interaction objects or raw API errors. There is no database, telemetry, analytics or external content service. Required network traffic goes to Discord's official API/Gateway.

Ephemeral replies are not a secret vault: Discord and the operator can process data, and channel members can reveal and copy it. Titles and warnings are intentionally public. Previously sent public cards and ephemeral replies can remain in Discord under its retention behavior after bot memory expires or is closed. No forensic secure-erasure, disk/swap encryption or screenshot protection is promised. See [SECURITY.md](SECURITY.md).

### Limits and keeping the bot online

Limits: title 60, single-line warning 120, private spoiler 600 UTF-16 code units; emoji can count as multiple units. Share short community notes, not lengthy copyrighted works. At most 10 active cards, 50 temporary form/preview/confirmation tickets and 2000 short cooldown keys are retained. Publication is serialized and limited to once per minute. A failed or rate-rejected publication consumes its preview; start a fresh form. Network failures can be ambiguous: check the channel before trying again. The bot does not automatically retry a send; a message delivered without an acknowledged response can leave an unusable public card.

Sleep, shutdown, terminal closure or process restart ends the bot and loses its RAM content. Public cards are not automatically deleted; old buttons return unavailable after restart/expiry. Delete old cards manually and create new ones. Production hosting requires one always-on Node 24 process, network access and a trusted service manager running `npm start` in the project folder. Register only when necessary; do not reset tokens on every restart. Keep secrets out of command-line arguments and service logs. This repository does not provision a production service.

### Troubleshooting

- Missing `node`/`npm`: install Node 24 LTS and reopen your terminal.
- Command missing: verify the server/Application ID, Guild Install, `applications.commands` scope and successful `npm run register`. Refresh Discord. You need Manage Server. Commands do not work in DMs.
- Channel error: use a normal server text channel; threads, forums, voice and DMs are unsupported. Check channel overrides and the two bot permissions. Do not add Administrator.
- `.env` already exists: the helper intentionally refuses overwrite. Follow reconfiguration steps or rerun only registration if that failed.
- No DM received: replies are ephemeral interactions in the same channel, not direct messages. Update Discord and check connectivity.
- Card unavailable: two hours passed, a manager closed it, or the bot restarted. Recreate it.
- Busy/cooldown: wait 2 seconds to reveal, 10 seconds to open another form or 1 minute to publish. Close an old card at the ten-card limit.
- API/network error: only general safe guidance is shown. Check permissions/network without logging the token. Inspect the channel after a failed publication and create a fresh preview.
- Supply check refuses `.env`: run development checks in a clean checkout without credentials. Do not disable the check.

### Tests, contributing and license

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
node --check scripts/setup.mjs
node --check scripts/check-supply.mjs
bash -n setup.sh start.sh
```

`check` runs Biome's recommended static/format rules, strict TypeScript compilation, Node behavior tests, dependency license/registry/SHA-512/install-script checks and source credential-pattern scans. Pattern scans cannot guarantee the absence of every secret. Read-only SHA-pinned CI repeats checks on Ubuntu, Windows and macOS Intel and requires a clean Git diff. If local Bash is unavailable, CI checks shell syntax.

Tests mock Discord interactions. They do not validate a real token/server, interactive hidden-token entry, mobile or screen-reader behavior. Publication success does not deploy a live bot; your installation and running process are required. Try a test channel with human review before community use. No VDS test is required. Contributions: [CONTRIBUTING.md](CONTRIBUTING.md). License: [MIT](LICENSE).

### Official references / Resmi kaynaklar

[Interactions and ephemeral responses](https://docs.discord.com/developers/interactions/receiving-and-responding), [Label modal components](https://docs.discord.com/developers/components/reference), [permissions](https://docs.discord.com/developers/topics/permissions), [application commands](https://docs.discord.com/developers/interactions/application-commands), [Gateway intents](https://docs.discord.com/developers/events/gateway), [Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy).
