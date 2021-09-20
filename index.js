'use strict';

const MAX_VALUE = BigInt(1000000000000000000);
const keysPrefix = ["FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "SIXTH", "SEVENTH", "EIGHTH"]
const tokenid = 0;
const text = `${keysPrefix[0]}${tokenid}`;

const intarray = BigInt("0x" + keccak256(text));
const first = intarray % (MAX_VALUE);
const firstNo = (first) / (MAX_VALUE);

const getDecimal = (number, token) => {
    const text = `${keysPrefix[number]}${token}`;
    const intarray = BigInt("0x" + keccak256(text));
    const luck = intarray % BigInt(21);
    let remainder = intarray % (MAX_VALUE);
    if (luck >= 19) {
        if (luck == 19) {
            remainder = remainder + ((MAX_VALUE - remainder) / BigInt(2))
        }
        else {
            remainder = ((MAX_VALUE - remainder) / BigInt(2))
        }
    }
    return (remainder.toString()) / (MAX_VALUE.toString());
}

let randomSeed = 0;
function Random(max = 1, min = 0) {
    randomSeed ^= randomSeed << 13;
    randomSeed ^= randomSeed >>> 17;
    return (Math.abs(randomSeed ^= randomSeed << 5) % 1e9 / 1e9) * (max - min) + min;
}

function GenerateRandomSeed() { return Math.random() * 1e9 | 0; }

function Update(tokenid = 0) {
    document.getElementById("tokenId").innerText = tokenid;

    settings.tileSize.Set(Math.round(getDecimal(0, tokenid)) * 24 + 8);
    // settings.rows.Set(getDecimal(1, tokenid));
    // settings.columns.Set(getDecimal(2, tokenid));
    // settings.displayMode.Set(getDecimal(3, tokenid));
    settings.seed.Set(getDecimal(4, tokenid) * 1e9);
    settings.colorSeed.Set(getDecimal(5, tokenid) * 1e9);
    settings.mutateSeed.Set(getDecimal(6, tokenid) * 1e9);
    settings.sheetSeed.Set(getDecimal(7, tokenid) * 1e9);

    // init canvas
    const tileSize = settings.tileSize.Get();
    const rows = settings.rows.Get();
    const columns = settings.columns.Get();
    canvas.height = rows * tileSize;
    canvas.width = columns * tileSize;

    // render sprites
    const displayMode = settings.displayMode.Get();
    let seed = settings.seed.Get();
    let colorSeed = settings.colorSeed.Get();
    let mutateSeed = settings.mutateSeed.Get();
    let animationSeed = GenerateRandomSeed();
    let sheetSeed = settings.sheetSeed.Get();
    for (let y = 0; y < rows; ++y)
        for (let x = 0; x < columns; ++x) {
            if (x || y) {
                // randomize parameters
                randomSeed = sheetSeed;
                if (displayMode == 0) {
                    seed = Random(1e9) | 0;
                }
                else if (displayMode == 1) {
                    mutateSeed = Random(1e9) | 0;
                    colorSeed = Random(1e9) | 0;
                }
                else if (displayMode == 2) {
                    mutateSeed = Random(1e9) | 0;
                }
                sheetSeed = randomSeed;
            }

            savedParameters[x + y * columns] = { seed, mutateSeed, colorSeed };
            ZzSprite(context, x * tileSize, y * tileSize, seed, settings.tileSize.Get(), settings.colorMode.Get(), mutateSeed, colorSeed);
        }

    // draw preview sprite
    const previewContext = previewCanvas.getContext('2d');
    previewCanvas.width = tileSize;
    previewCanvas.height = tileSize;
    previewContext.fillStyle = '#fff';
    previewContext.fillRect(0, 0, 2e3, 2e3);
    previewContext.drawImage(canvas, 0, 0);
}

class Setting {
    constructor(name, value, max = 1, min = 0, step = 1, advanced = 0) {
        const container = advanced ? advancedSettingsContainer : settingsContainer;
        const nameElement = document.createElement('span');
        nameElement.innerText = name;
        container.appendChild(nameElement);

        const e = this.element = document.createElement('input');
        container.appendChild(e);

        e.type = 'number';
        e.value = this.default = value;
        e.max = this.max = max;
        e.min = this.min = min;
        e.step = step;

        this.element.onchange = e => {
            this.Set(step == 1 ? this.element.value | 0 : this.element.value);
            Update();
        }
    }

    SetDefault() { this.Set(this.default); }

    Set(value) {
        value = value || 0;
        if (value < this.min)
            value = this.min;
        else if (value > this.max)
            value = this.max;

        this.element.value = value;
    }
    Get() { return parseFloat(this.element.value); }
}

class SettingDropDown {
    constructor(name, options, advanced = 0) {
        const container = advanced ? advancedSettingsContainer : settingsContainer;
        const nameElement = document.createElement('span');
        nameElement.innerText = name;
        container.appendChild(nameElement);

        this.element = document.createElement('select');
        container.appendChild(this.element);
        options.map((o, i) => {
            let e = document.createElement('option');
            e.innerHTML = o;
            e.value = i;
            this.element.appendChild(e);
        });

        this.element.onchange = e => Update();
    }

    SetDefault() { this.Set(0); }
    Set(value) { this.element.selectedIndex = value; }
    Get() { return this.element.options[this.element.selectedIndex].value; }
}

function BuildHTML() {
    document.title = programTitle + ' - ' + programDescription;
    programTitleDiv.innerHTML = programTitle + ' v' + programVersion;
    canvas.title = 'Click to select seed';

    settings.seed = new Setting('Seed', GenerateRandomSeed(), 1e9);
    settings.tileSize = new Setting('Tile Size', 16, 32, 8, 1);
    settings.displayMode = new SettingDropDown('Display Mode',
        ['Seeds', 'Mutations', 'Animations']);
    settings.colorMode = new SettingDropDown('Color Mode',
        ['Full Color', '4 Colors', '2 Colors', '1 Color']);
    settings.rows = new Setting('Rows', 16, 128, 1);
    settings.columns = new Setting('Columns', 32, 128, 1);

    // advanced
    settings.colorSeed = new Setting('Color Seed', 0, 1e9, 0, 1, 1);
    settings.mutateSeed = new Setting('Mutate Seed', 0, 1e9, 0, 1, 1);
    settings.sheetSeed = new Setting('Sheet Seed', GenerateRandomSeed(), 1e9, 0, 1, 1);

    let e;
    /*e = settingsContainer.appendChild(document.createElement('button'));
    e.innerHTML = 'Reset';
    e.title = 'Reset all parameters.';
    e.onclick = e => 
    { 
        // reset defaults
        for(const setting in settings)
        {
            const s = settings[setting];
            s.SetDefault && s.SetDefault();
        }

        settings.seed.Set(GenerateRandomSeed()); 
        settings.sheetSeed.Set(GenerateRandomSeed()); 
        Update(); 
    };*/

    e = settingsContainer.appendChild(document.createElement('button'));
    e.innerHTML = 'Randomize';
    e.title = 'Randomize sprite sheet.';
    e.onclick = e => {
        settings.sheetSeed.Set(GenerateRandomSeed());
        if (settings.displayMode.Get() == 0)
            settings.seed.Set(GenerateRandomSeed());
        Update();
    };

    e = settingsContainer.appendChild(document.createElement('button'));
    e.innerHTML = 'Save Sheet';
    e.title = 'Save png of entire sheet.';
    e.onclick = e => link.click(
        link.href = canvas.toDataURL('image/png'),
        link.download = 'sprite_sheet');

    e = settingsContainer.appendChild(document.createElement('button'));
    e.innerHTML = 'Save Sprite';
    e.title = 'Save png of sprite.';
    e.onclick = e => link.click(
        link.href = previewCanvas.toDataURL('image/png'),
        link.download = 'sprite');

    e = settingsContainer.appendChild(document.createElement('button'));
    e.innerHTML = 'Copy Sprite';
    previewCanvas.title = e.title = 'Copy sprite to clipboard.';
    previewCanvas.onclick =
        e.onclick = e => {
            try {
                previewCanvas.toBlob(blob =>
                    navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]));
            } catch (e) {
                alert('Could not copy!');
            }
        }
}

canvas.onmousedown = e => {
    // get click tile
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const tileSize = settings.tileSize.Get();
    const X = (e.x - rect.left) * scaleX / tileSize | 0;
    const Y = (e.y - rect.top) * scaleY / tileSize | 0;

    // update settings
    const columns = settings.columns.Get();
    const parameters = savedParameters[X + Y * columns];
    settings.seed.Set(parameters.seed, 0);
    settings.colorSeed.Set(parameters.colorSeed, 0);
    settings.mutateSeed.Set(parameters.mutateSeed, 0);
    Update();
}

const programTitle = 'ZzSprite';
const programDescription = 'Tiny Sprite Generator';
const programVersion = '1.0';
const savedParameters = [];
const settings = {};
const context = canvas.getContext('2d');
BuildHTML();
Update();


document.getElementById("tokenIdButton").onclick = () => {
    // app.destroy();
    // document.getElementsByTagName("canvas")[0].remove();
    // app = new ChladniApp(document.getElementById("tokenIdInput").value );

    Update(document.getElementById("tokenIdInput").value);
}

document.getElementById("randomButton").onclick = () => {
    // app.destroy();
    // document.getElementsByTagName("canvas")[0].remove();
    // app = new ChladniApp(document.getElementById("tokenIdInput").value );

    Update(Math.floor(Math.random() * 10000));
}