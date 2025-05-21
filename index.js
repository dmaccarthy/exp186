import url from 'url';
import express from 'express';
import mathjax from 'mathjax';

const app = express();
app.use(express.static('public'));

app.use(function(req, res, next) {
/* Log request after response is completed */
    res.on("finish", () => {
        console.log(`${res.statusCode} - ${req.url}`);
    });
    next();
});

function trusted(req, res, next) {
/* Check for trusted referers */
    let refer = req.headers.referer;
    if (refer) {
        let host = url.parse(refer).host;
        if (trusted.hosts.indexOf(host) > -1)
            res.setHeader("Access-Control-Allow-Origin", `${req.protocol}://${host}`);
    }
    next();
}

trusted.hosts = [
    "dmaccarthy.github.io",
    "node186.glitch.me",
    // "replit.com",
];

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
        let svg = MathJax.startup.adaptor.outerHTML(m.children[0]);
        if (cc) svg = svg.replaceAll(`"currentColor"`, `"${cc}"`)
        res.writeHead(200, {"Content-Type": "image/svg+xml"});
        res.end(svg);
    });
});

app.get(/\/.*/, (req, res) => {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.end(`Not found: ${req.url}`);
});

mathjax.init({
    loader: {load: ['input/tex', 'output/svg', '[tex]/color', '[tex]/cancel']},
    tex: {packages: {'[+]': ['color', 'cancel']}}
}).then(app.listen(3000, () => {
    console.log('Serving...');
}));
