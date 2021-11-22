
let themes = require('../themes.json');

//console.log(themes, 'the json obj');

// https://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object
let newThemes = JSON.parse(JSON.stringify(themes));
// go throw all themes
Object.entries(themes).map(([theme, v]) => {
    //  if(theme.source === "Bootswatch"){
    console.log("Theme %s with params %s", theme, v);
    //newThemes = JSON.parse(JSON.stringify(themes));

    const source = v.source;
    let css_url = v.css_url;
    let css_integrity = v.css_integrity;
    let needNewHash = false;
    if (source === "Bootswatch") {

        needNewHash = true;
        css_url = "https://cdn.jsdelivr.net/npm/" + source.toLowerCase() + "@4.5.2/dist/" + theme + "/bootstrap.min.css";
        console.log("new css_url:", css_url);
    } else if (source === "HackerThemes") {
        // https://github.com/HackerThemes/theme-machine 2 years old

    } else if (source === "TopHat") {
        //https://github.com/ThemesGuide/top-hat 2 years old

    }

    // only if new version exists
    if (needNewHash) {
        const fetch = require('node-fetch');


        //Loading the crypto module in node.js
        const crypto = require('crypto');

        //(async () => {
            try {

                fetch(css_url).then(res => res.text()).then(text => {

                    //creating hash object
                    const hash = crypto.createHash('sha384');
                    //passing the data to be hashed
                    const data = hash.update(text, 'utf-8');
                    //Creating the hash in the required format
                    const gen_hash = data.digest('base64'); //'hex');
                    //Printing the output on the console
                    console.log("hash : " + gen_hash);
                    css_integrity = gen_hash;

                });
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('request was aborted');
                }
            }
        //})();
        // update new themes
        newThemes[theme].css_url = css_url;
        newThemes[theme].css_integrity = css_integrity;

    }


});
const newThemeFileName = 'newthemes.json';
console.log("Start to create new themes file ", newThemeFileName);

const fs = require("fs");
fs.writeFile(newThemeFileName, JSON.stringify(newThemes, null, 2), 'utf8', function (err) {
        if (err) throw err;
        console.log('complete of write ', newThemeFileName);
    }
);




									