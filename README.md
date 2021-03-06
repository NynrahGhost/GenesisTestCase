# GenesisTestCase
Автор: Куценко Михайло

## Засоби розробки
Web API реалізовано за допомогою NodeJS з використанням наступних бібліотек:
 - Crypto (вбудована в NodeJS)
 - Express
 - Https
 - Cookie-parser

Для визначення курсу біткоїну було обрано [CoinAPI](https://www.coinapi.io/).

## Роути
### /btcRate
GET метод. Якщо користувач аутентифікований, то повертає json об'єкт, з полем rate у якому зазначений курс біткоїну до гривні. В іншому разі повертає статус 401 з відповідним повідомленням. 
### /user/login
POST метод. Очікує email та password в якості URL параметрів.
### /user/create
PUT метод. Очікує email та password в якості URL параметрів.

## Користувацькі дані
Під час запуску сервера користувацькі дані зчитуються з файлу *data.json* і надалі тримаються в пам'яті у вигляді хеш-таблиці.<br/>
З заданим в налаштуваннях інтервалом відбувається перевірка на наявність змін у таблиці (при доданні нового користувача встановлюється відповідний прапорець)
і у разі їх наявності, відбувається перезапис файлу *data.json* наявними даними у таблиці.

## Використані рішення
Для зручності виділений файл опцій, *options.json*.<br/>

З міркувань безпеки, з'єднання відбувається по https.<br/>
Для проекту я згенеровав самопідписаний сертифікат.<br/>

Паролі користувачів надсилаються у чистому вигляді, а вже на стороні сервера хешуються алгоритмом SHA-256 і зберігаються в захешованому вигляді.<br/>
Для перевірки правильності паролю відбувається порівняння хешу що зберігається в даних з хешем надісланого паролю.<br/>

Після успішної аутентифікації генерується токен, який встановлюється користувачу у cookie та додається до масиву токенів.<br/>
Також є масив дат просрочення токенів, де кожна позиція відповідає відповідному токену у масиві токенів.<br/>
Інтервалом у визначений у налаштуваннях час відбувається видалення просрочених токенів.
(реалізовано асинхронною функцією)<br/>

При проходжені до /btcRate перевіряється наявність валідного токена. Таким чином перевіряється чи аутентифікований користувач.<br/>

Для оновлення даних існує фоновий процес, який перевіряє чи відбувалася зміна у таблиці за поточний цикл, і якщо так, то файл даних переписується. 
(реалізовано асинхронною функцією, яка викликає сама себе з заданим інтервалом)
