load('/docker-entrypoint-initdb.d/flashcards.js');

db = connect("mongodb://127.0.0.1:27017/languages");

db.russian.insertMany(russian);