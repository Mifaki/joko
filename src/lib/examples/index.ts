export interface Example {
	label: string;
	description: string;
	content: string;
}

export const examples: Example[] = [
	{
		label: 'User Profile',
		description: 'Simple nested object',
		content: `{
  "id": 1,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "age": 28,
  "address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102"
  },
  "tags": ["developer", "svelte", "typescript"],
  "active": true,
  "score": null
}`
	},
	{
		label: 'Products Array',
		description: 'Array of objects',
		content: `[
  {
    "id": 101,
    "name": "Mechanical Keyboard",
    "price": 149.99,
    "category": "Electronics",
    "inStock": true,
    "specs": { "switches": "Cherry MX Blue", "layout": "TKL", "backlight": "RGB" }
  },
  {
    "id": 102,
    "name": "Ergonomic Mouse",
    "price": 79.99,
    "category": "Electronics",
    "inStock": false,
    "specs": { "dpi": 16000, "buttons": 7, "wireless": true }
  },
  {
    "id": 103,
    "name": "USB-C Hub",
    "price": 49.99,
    "category": "Accessories",
    "inStock": true,
    "specs": { "ports": 7, "powerDelivery": 100, "4k": true }
  }
]`
	},
	{
		label: 'App Config',
		description: 'Deeply nested config',
		content: `{
  "server": {
    "host": "localhost",
    "port": 3000,
    "cors": {
      "origins": ["http://localhost:5173", "https://myapp.vercel.app"],
      "methods": ["GET", "POST", "PUT", "DELETE"]
    }
  },
  "database": {
    "url": "postgresql://user:pass@localhost/db",
    "poolSize": 10,
    "ssl": false
  },
  "auth": {
    "jwtSecret": "supersecret",
    "tokenExpiry": "24h",
    "refreshExpiry": "7d",
    "providers": ["google", "github"]
  },
  "features": {
    "darkMode": true,
    "analytics": false,
    "betaAccess": ["admin", "tester"]
  }
}`
	},
	{
		label: 'Messy JSON',
		description: 'Badly formatted — try the formatter!',
		content: `{  "project"  : "joko",
"version":"1.0.0",   "description":   "A blazing-fast JSON formatter",
  "features":["real-time formatting","syntax highlighting",
    "error detection","large file support"],
  "config":{
    "indent":2,"theme":"light",
    "validateOnType":  true
  },
  "author":{"name":"Open Source Community","license": "MIT"},
  "stats":  {"stars":1337,"forks":42,"issues":0}
}`
	}
];
