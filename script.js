
var size = 3;
const groupElements = [];
const generateButton = document.getElementById("generate");
const sizeEl = document.getElementById("size");

function generateUnique(selector) {
    var result;
    do {
        result = Math.floor(Math.random() * 0xffffffff).toString(34);
    } while(document.querySelector(selector.replace('@', result)));
    return result;
}

function createPermMatrixView(size) {
    const table = document.createElement("table");
    const id = generateUnique('[name="@"]');
    const radios = {};
    /** Usage: target[x] = y */
    const target = {};
    /** Usage: source[y] = x */
    const source = {};
    const matrix = [];
    for(var y = 0; y < size; y++) {
        const row = document.createElement("tr");
        const rowRadios = {};
        radios[y] = rowRadios;
        matrix[y] = [];
        for(var x = 0; x < size; x++) {
            const entry = document.createElement("td");
            const radio = document.createElement("input");
            const label = document.createElement("label");
            const div = document.createElement("div");
            radio.type = "radio";
            radio.name = id + y;
            radio.dataset.x = x;
            radio.dataset.y = y;
            if(x === y) radio.checked = true;
            radio.addEventListener('input', function() {
                const dstX = this.dataset.x;
                const srcX = source[this.dataset.y];
                const y1 = this.dataset.y;
                const y2 = target[this.dataset.x];
                radios[y2][srcX].checked = true;
    
                source[y2] = srcX;
                source[y1] = dstX;
                target[srcX] = y2
                target[dstX] = y1

                matrix[y1][srcX] = 0;
                matrix[y1][dstX] = 1;
                matrix[y2][srcX] = 1;
                matrix[y2][dstX] = 0;
                window.dispatchEvent(new Event('elementchange'));
            });
            entry.appendChild(label);
            label.appendChild(radio);
            label.appendChild(div);
            row.appendChild(entry);
            rowRadios[x] = radio;
            matrix[y][x] = x == y ? 1 : 0;
        }
        target[y] = y.toString();
        source[y] = y.toString();
        table.appendChild(row);
        table.classList.add("permutation-matrix");
    }
    function setMatrix(m) {
        for(var y = 0; y < size; y++) {
            for(var x = 0; x < size; x++) {
                if(m[y][x] !== 1) continue;
                const radio = radios[y][x];
                if(radio.checked) break;
                radio.checked = true;
                radio.dispatchEvent(new Event("input"));
                break;
            }
        }
    }
    return {
        getRoot: () => table,
        getSize: () => size,
        getMatrix: () => matrix,
        setMatrix: setMatrix,
    }
}

/** Return true if name exist, false otherwise */
function checkName(name, ignored) {
    for(var i = 0; i < groupElements.length; i++) {
        if(i == ignored) continue;
        if(groupElements[i].getName() == name) return true;
    }
    return false;
}

function incrementLetter(arr, index) {
    const bounds = ["az", "AZ", "09"];
    var overflow = false;
    var overflowStart = undefined;
    const v = arr[index] ?? arr[index - 1];
    for(var i = 0; i < bounds.length; i++) {
        const bound = bounds[i];
        const start = bound.codePointAt(0);
        const end = bound.codePointAt(1);
        if(start <= v && v <= end) {
            overflow = v == end;
            overflowStart = start;
            break;
        }
    }
    if(overflow) {
        arr[index] = overflowStart;
        incrementLetter(arr, index + 1);
    } else {
        arr[index] = v + 1;
    }
}

function generateName() {
    var arr, name;
    if(groupElements.length !=0) {
        arr = groupElements[groupElements.length - 1].getName().split('').reverse().map(e => e.codePointAt(0));
    } else {
        arr = ['A'.codePointAt(0) - 1];
    }
    do {
        incrementLetter(arr, 0);
        name = arr.map(e => String.fromCodePoint(e)).reverse().join('');
    } while(checkName(name));
    return name;
}

function addGroupElement(size) {
    var index = groupElements.length;
    var name = generateName();
    const perm = createPermMatrixView(size);

    const root = document.getElementById("expandable-template").cloneNode(true);
    const nameEl = root.querySelector(".name");
    const moveUp = root.querySelector(".move-up");
    const moveDown = root.querySelector(".move-down");
    const content = root.querySelector('.content');
    const rename = root.querySelector(".rename");
    const header = root.querySelector('.header');
    const input = root.querySelector(".rename-input");
    const errorBtn = root.querySelector(".error");
    const errorPopover = new bootstrap.Popover(errorBtn);
    const errors = [];
    function onEditFinish() {
        if(rename.style.display == 'block') return;
        if(input.value != "") {
            name = input.value;
        }
        input.style.display = 'none';
        nameEl.removeAttribute("style");
        nameEl.textContent = name;
        rename.style.display = "block";
    }
    function addError(msg) {
        if(errors.indexOf(msg) != -1) return;
        errors.push(msg);
        errorBtn.style.display = 'block';
        errorPopover._config.content = errors.join(', ');
    }
    function removeError(err) {
        const index = errors.indexOf(err);
        if(index == -1) return;
        errors.splice(index, 1);
        errorPopover._config.content = errors.join(', ');
        if(errors.length == 0) {
            errorBtn.style.display = "none";
        }
    }
    function deleteSelf() {
        root.parentElement.removeChild(root);
        groupElements.splice(index, 1);
        updateElementAction();
        validateName();
        window.dispatchEvent(new Event('elementchange'))
    }
    root.querySelector(".delete").addEventListener("click", deleteSelf);
    rename.addEventListener("click", function(e) {
        input.removeAttribute("style");
        nameEl.style.display = 'none';
        input.value = name;
        input.focus();
        rename.style.display = "none";
    });
    moveUp.addEventListener("click", function(e) {
        root.parentElement.insertBefore(root, root.previousElementSibling);
        const tmp = groupElements[index];
        groupElements[index] = groupElements[index - 1];
        groupElements[index - 1] = tmp;
        updateElementAction();
    });
    moveDown.addEventListener("click", function(e) {
        const nextEl = root.nextElementSibling.nextElementSibling;
        if(nextEl) root.parentElement.insertBefore(root, nextEl);
        else root.parentElement.appendChild(root);
        const tmp = groupElements[index];
        groupElements[index] = groupElements[index + 1];
        groupElements[index + 1] = tmp;
        updateElementAction();
    });
    input.addEventListener("keyup", function(e) {
        if(e.key == "Enter") {
            onEditFinish();
        } else {
            validateName(index, input.value);
        }
    });
    errorBtn.addEventListener('mouseenter', () => errorPopover.show());
    errorBtn.addEventListener('mouseleave', () => errorPopover.hide());
    input.addEventListener("blur", onEditFinish);
    nameEl.textContent = name;
    root.removeAttribute("style");
    root.removeAttribute("id");
    document.querySelector(".group-elements").appendChild(root);
    content.appendChild(perm.getRoot());

    const height = content.clientHeight;
    content.style.height = '0px';
    header.addEventListener('click', function(e) {
        if(e.target != header && !e.target.classList.contains("name")) return
        root.classList.toggle('expand');
        content.style.height = (height - content.clientHeight) + 'px';
    });

    groupElements.push({
        setIndex: (i) => index = i,
        setMoveUpEnabled: (enabled) => { moveUp.disabled = !enabled },
        setMoveDownEnabled: (enabled) => { moveDown.disabled = !enabled },
        addError: addError,
        getName: () => name,
        setName: (newName) => {
            name = newName;
            nameEl.textContent = newName;
        },
        removeError: removeError,
        delete: deleteSelf,
        getMatrix: perm.getMatrix,
        setMatrix: perm.setMatrix,
    });
    updateElementAction();
    errorBtn.style.display = "none";
    window.dispatchEvent(new Event('elementchange'));
    header.dispatchEvent(new Event("click"));
    return groupElements[groupElements.length - 1];
}

function updateElementAction() {
    for(var i = 0; i < groupElements.length; i++) {
        const item = groupElements[i];
        item.setMoveUpEnabled(i != 0);
        item.setMoveDownEnabled(i != groupElements.length - 1);
        item.setIndex(i);
    }
}

function findElementName(m) {
    for(var i = 0; i < groupElements.length; i++) {
        const item = groupElements[i];
        if(compareMatrix(item.getMatrix(), m) === 0) {
            return item.getName();
        }
    }
}

window.addEventListener("elementchange", function() {
    const msg = "Duplicate element"
    const errors = [];
    for(var i = 1; i < groupElements.length; i++) {
        const a = groupElements[i];
        for(var j = 0; j < i; j++) {
            const b = groupElements[j];
            if(compareMatrix(a.getMatrix(), b.getMatrix()) == 0) {
                errors[i] = true;
                errors[j] = true;
                break;
            }
        }
    }
    for(var i = 0; i < groupElements.length; i++) {
        if(errors[i]) {
            groupElements[i].addError(msg);
        } else {
            groupElements[i].removeError(msg);
        }
    }
});

window.addEventListener("matsizechange", function() {
    sizeEl.textContent = size;
    for(var i = groupElements.length - 1; i >= 0; i--) {
        groupElements[i].delete();
    }
});

document.getElementById("add-element").addEventListener('click', function() {
    addGroupElement(size);
});

document.getElementById("generate").addEventListener("click", function() {
    const result = [];
    var changed = true;
    while(changed) {
        changed = false;
        for(var i = 0; i < groupElements.length; i++) {
            if(!result[i]) result[i] = [];
            const a  = groupElements[i];
            for(var j = 0; j < groupElements.length; j++) {
                if(result[i][j]) continue;
                const b  = groupElements[j];
                const m = multiplyMatrix(a.getMatrix(), b.getMatrix());
                var name = findElementName(m);
                if(name) {
                    result[i][j] = name;
                } else {
                    const el = addGroupElement(size);
                    el.setMatrix(m);
                    result[i][j] = el.getName();
                    changed = true;
                }
            }
        }
    }
    const root = document.createElement("table");
    var head = document.createElement("tr");
    head.appendChild(document.createElement("td"));
    root.appendChild(head);
    for(var i = 0; i < groupElements.length; i++) {
        const el = document.createElement("td");
        el.textContent = groupElements[i].getName();
        head.appendChild(el);
    }
    for(var i = 0; i < groupElements.length; i++) {
        const row = document.createElement("tr");
        root.appendChild(row);
        head = document.createElement("td");
        row.appendChild(head);
        head.textContent = groupElements[i].getName();
        for(var j = 0; j < groupElements.length; j++) {
            const el = document.createElement("td");
            el.textContent = result[i][j];
            row.appendChild(el);
        }
    }
    const container = document.getElementById("cayley-table");
    if(container.childElementCount == 1) {
        container.removeChild(container.children[0]);
    }
    container.appendChild(root);
});

document.getElementById("resize").addEventListener("click", function() {
    var newSize = parseInt(prompt("Enter new size:", size));
    if(isNaN(newSize)) return;
    if(newSize == size) return;
    size = newSize;
    window.dispatchEvent(new Event("matsizechange"));
});

document.getElementById("copy").addEventListener('click', function() {
    const result = {};
    groupElements.forEach(el => {
        result[el.getName()] = el.getMatrix();
    });
    const text = JSON.stringify(result);
    const inputBox = document.getElementById("paste-box");
    inputBox.style.display = "block";
    inputBox.value = text;
    inputBox.select();
    inputBox.setSelectionRange(0, text.length);
    try {
        navigator.clipboard.writeText(text);
    } catch(e) {}
    inputBox.style.display = "none";
});

document.getElementById("paste").addEventListener('click', function() {
    const data = JSON.parse(prompt("Paste your matrix permutation here"));
    if(!data) {
        return;
    }
    var currSize = 0;
    for(var i in data) {
        const item = data[i];
        if(currSize == 0) {
            currSize = item.length;
        } else if(currSize != item.length) {
            return;
        }
        for(var j = 0; j < currSize; j++) {
            if(item[j].length != currSize) {
                return;
            }
        }
    }
    size = 0;
    window.dispatchEvent(new Event("matsizechange"));
    size = currSize;
    window.dispatchEvent(new Event("matsizechange"));
    for(var i in data) {
        const el = addGroupElement(currSize);
        el.setMatrix(data[i]);
        el.setName(i);
    }
    validateName();
    
});

function validateName(index, subsName) {
    const msg = "Duplicate name";
    const usedName = {};
    for(var i = 0; i < groupElements.length; i++) {
        var name = i == index ? subsName : groupElements[i].getName();
        usedName[name] = (usedName[name] ?? 0) + 1;
    }
    for(var i = 0; i < groupElements.length; i++) {
        const el = groupElements[i];
        var name = i == index ? subsName : el.getName();
        if(usedName[name] == 1) {
            el.removeError(msg);
        } else {
            el.addError(msg);
        }
    }
}

window.dispatchEvent(new Event("matsizechange"));
addGroupElement(size).setMatrix([[1,0,0],[0,1,0],[0,0,1]]);
addGroupElement(size).setMatrix([[0,0,1],[1,0,0],[0,1,0]]);

document.getElementById("generate").dispatchEvent(new Event('click'));