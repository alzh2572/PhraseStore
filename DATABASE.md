## Что есть в системе (сущности):

Note - заметки
User — владелец фраз/цитат, автор, голосующий
Phrase — сама фраза/цитата (может быть приватной или публичной)
Tag — метки (многие-ко-многим с Phrase)
Vote — голос пользователя за публичную фразу/цитату (уникально: один пользователь → один голос на промт)
(опционально) Collection / Folder — папки/коллекции для организации
(опционально) PhraseVersion — версии фраз/цитат (история изменений)

## Ключевые правила:

* Публичность — это свойство Phrase (visibility)
* Голосовать можно только по публичным (проверяется на уровне приложения; можно усилить триггером/констрейнтом позже)
* Голос уникален: (userId, phraseId) — уникальный индекс

## Схема базы данных

* Note: id, ownerId -> User, title, createdAt
* User: id (cuid), email unique, name optional, createdAt
* Phrase: id, ownerId -> User, title, content, description optional, categoryId -> Category,
visibility (PRIVATE|PUBLIC, default PRIVATE), createdAt, updatedAt, publishedAt nullable
* Vote: id, userId -> User, phraseId -> Phrase, value int default 1, createdAt
* Category: id, category
* Ограничение: один пользователь может проголосовать за фразу/цитату только один раз:
UNIQUE(userId, phraseId)
* Индексы:
Phrase(ownerId, updatedAt)
Phrase(visibility, createdAt)
Vote(phraseId)
Vote(userId)
* onDelete: Cascade для связей

