/* ==================================================
   AVYORA - MAIN JAVASCRIPT
   File: src/main.js
   ================================================== */


import "./style.css";


/* ==================================================
   IMPORT COMPONENTS
   ================================================== */

import heroHTML from "./components/hero.html?raw";


/* ==================================================
   LOAD COMPONENTS
   ================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        /* =========================================
           HERO COMPONENT
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