function zoom(z) {
    for (let img of $("#Images img")) {
        let [w, h] = img.original_size;
        $(img).css({width: `${w*z}px`, height: `${h*z}px`});
    }
}

function click(ev) {
    let p = ev.target;
    p = $(p.tagName == "P" ? p : $(p).closest("p"));
    $("#Input").val(p.attr("data-tex"));
    if (ev.altKey) {
        click.remove = p;
        p.remove();
    }
}

function render() {
    let e = $("#Input");
    let tex = e.val();
    if (!tex) return;
    let img = new Image();
    img.onload = () => {
        img.original_size = [img.width, img.height];
        $("<p>").attr({"data-tex": tex}).append(img).on("click", click).appendTo("#Images");
        zoom(render.zoom);
        e.val("");
    }
    img.src = `/mjax.svg?tex=${encodeURIComponent(tex)}&color=${render.color}`;
}

render.color = "black";
render.zoom = 2;

function menu(c) {
/* Toggle the menu and redraw if visible */
    let m = $("#Menu");
    if (m.is(":visible") && c == null) m.fadeOut();
    else {
        if (c != null) menu.current = c;
        let path = menu.path(menu.current);
        let div = $("#Path").html("");
        let home = path.length == 1;
        for (let i=path.length-1;i>=0;i--) {
            let p = $("<p>").html(path[i].name).appendTo(div);
            p[0].menu_node = path[i];
            if (i==0) {
                if (home) p.html("Import...").on("click", load_eq);
                else p.addClass("Current");
            }
        }
        if (!home) div.find("p:not(.Current)").on("click", path_click);
        div = $("#Options").html("");
        let cmenu = menu.current.menu;
        for (let i=0;i<cmenu.length;i++) {
            let p = $("<p>").html(cmenu[i].name).appendTo(div);
            p[0].opt_node = cmenu[i];
        }
        div.find("p").on("click", opt_click);
        m.fadeIn();
    }
}

menu.init = (m) => {
    let items = m.menu;
    for (let item of items) {
        item.up = m;
        if (item.menu) menu.init(item);
    }
    return m;
}

menu.path = (cur) => {
    let path = [cur];
    while (cur.up) {
        cur = cur.up;
        path.push(cur);
    }
    return path;
}

function path_click(ev) {
    let e = $(ev.currentTarget);
    menu(e[0].menu_node);
}

function opt_click(ev) {
    let e = $(ev.currentTarget);
    let m = e[0].opt_node;
    if (m.menu) menu(m);
    if (m.eq) {
        $("#Input").val(m.eq);
        $("#Render").trigger("click");
    }
}

function load_eq(ev) {
    console.log(ev);
    confirm("Unavailable!");
}

$(() => {
    fetch("eq.json").then((a) => a.json()).then((eq) => {
        menu.eq = menu.current = menu.init(eq);
        menu();
        $(window).on("keydown", (ev) => {
            if (ev.originalEvent.key == "Escape") menu();
        })
    });
});
