# MongoVault backup API

`POST /api/backup/download` with `{ "uri" }` connects to that database, writes each collection as JSON, and returns a ZIP. The ZIP is not saved on disk.

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

```bash
curl -X POST http://localhost:5000/api/backup/download \
  -H 'Content-Type: application/json' \
  -d '{"uri":"mongodb+srv://USERNAME:PASSWORD@cluster.example.mongodb.net/myDatabase"}' \
  -OJ
```
