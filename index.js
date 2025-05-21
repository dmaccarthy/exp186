import url from 'url';
import express from 'express';
import mathjax from 'mathjax';
import busboy from 'busboy';

const app = express();
app.use(express.static('public'));

app.use((req, res, next) => {
/* Log request after response is completed */
    res.on("finish", () => {
        let d = new Date().toUTCString().substring(5, 25);
        let m = `${req.method}`.padEnd(4, ' ');
        console.log(`[${d}] ${res.statusCode} - ${m} ${req.url}`);
    });
    next();
});

function trusted(req, res, next) {
/* Check for trusted referers */
    let refer = req.headers.referer;
    if (refer) {
        let host = url.parse(refer).host;
        if (trusted.hosts.indexOf(host) > -1)
            res.setHeader("Access-Control-Allow-Origin", `https://${host}`);
    }
    next();
}

trusted.hosts = [
    "dmaccarthy.github.io",
    // "node186.glitch.me",
    // "replit.com",
];

function formdata(req, res, next) {
/* Get form data using npmjs.com/package/busboy */
    let fields = {};
    let files = {};
    req.formdata = [fields, files];
    let bb = busboy({headers: req.headers});
    bb.on('file', (name, file, info) => {
        let {filename, encoding, mimeType} = info;
        let finfo = files[name] = {filename: filename, bytes: 0, data: [], encoding: encoding, mimeType: mimeType}
        file.on('data', (data) => {
            finfo.data.push(data);
            finfo.bytes += data.length;
        }); /*.on('close', () => {})*/
    });
    bb.on('field', (name, val, info) => {
        fields[name] = [val, info];
    });
    bb.on('close', next);
    req.pipe(bb);
}

/*** Request handlers ***/

app.get("/utc.json", trusted, (req, res) => {
/* Send server UTC time */
    let d = new Date();
    d = {year: d.getUTCFullYear(), month: d.getUTCMonth()+1, day: d.getUTCDate(),
         hour: d.getUTCHours(), min: d.getUTCMinutes(), sec: d.getUTCSeconds(),
         msec: d.getUTCMilliseconds()};
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(JSON.stringify(d));
});

app.get("/mjax.svg", trusted, (req, res) => {
/* Use MathJax to render as SVG */
    let cc = req.query.color;
    MathJax.tex2svgPromise(req.query.tex).then((m) => {
        let svg = app.mj_svg(m);
        if (cc) svg = svg.replaceAll(`"currentColor"`, `"${cc}"`)
        res.writeHead(200, {"Content-Type": "image/svg+xml"});
        res.end(svg);
    });
});

app.post("/formecho", formdata, (req, res) => {
/* Echo the content of a form submission */
    let [fields, files] = req.formdata;
    let s = "Fields...\n";
    for (let k in fields) s += `${k}: ${fields[k][0]}\n`;
    s += "\nFiles...\n";
    for (let k in files) {
        let f = files[k];
        s += `${f.filename}: ${f.bytes} bytes\n`;
    }
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end(s);
})

app.get(/\/.*/, (req, res) => {
/* Send 404 error if request URL has no handler*/
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.end(`Not found: ${req.url}`);
});


/*** Initialize MathJax and then start the server ***/

mathjax.init({
    loader: {load: ['input/tex', 'output/svg', '[tex]/color', '[tex]/cancel']},
    tex: {packages: {'[+]': ['color', 'cancel']}}
}).then(() => {
    app.mj_svg = (node) => MathJax.startup.adaptor.outerHTML(node.children[0]);
    app.listen(3000, () => {console.log('Serving...')});
});
