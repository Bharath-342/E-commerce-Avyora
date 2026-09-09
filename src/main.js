/* ==================================================
   AVYORA - MAIN JAVASCRIPT
   File: src/main.js
   ================================================== */

import "./style.css";

import heroHTML from "./components/hero.html?raw";


/* ==================================================
   LOAD PAGE COMPONENTS
   ================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        /* =========================================
           HERO
           ========================================= */

        const heroContainer =
            document.getElementById(
                "hero-container"
            );


        if (heroContainer) {

            heroContainer.innerHTML =
                heroHTML;

        }

    }
);