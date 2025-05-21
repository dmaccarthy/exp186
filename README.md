# exp186
Experimental Express / MathJax repo

Install and run the server

```
npm install
npm start
```

Render some MathJax; pass TeX code as query string argument using `encodeURIComponent` 

```
http://localhost:3000/mjax.svg?tex=V%3D%5Cfrac%7B4%5Cpi%7D%7B3%7Dr%5E3&color=blue
```

Open the interactive MathJax renderer
```
http://localhost:3000/mjax/
```
