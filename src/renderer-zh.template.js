/*
 * MySQL Workbench 简体中文语言包 - 渲染进程运行时翻译层
 * MySQL Workbench Simplified Chinese language pack - runtime renderer layer.
 *
 * This file is injected by index.html. It translates user interface text in the
 * DOM and leaves all data (SQL editor content, result grids, object names)
 * untouched. Remove the <script> tag from index.html to disable it.
 */
(function () {
    "use strict";

    if (window.__WB_ZH_INSTALLED__) {
        return;
    }
    window.__WB_ZH_INSTALLED__ = true;

    try {
        if (window.localStorage && window.localStorage.getItem("mysqlwb-zh") === "off") {
            return;
        }
    } catch (error) {
        /* localStorage can be unavailable in some contexts; keep going. */
    }

    var DICT = __DICT__;
    var PATTERNS = __PATTERNS__;
    var ATTRIBUTES = ["title", "placeholder", "aria-label", "aria-description", "alt", "label", "data-tooltip"];

    // Labels rendered through CSS text-transform are matched case-insensitively,
    // but only for ALL CAPS text so that ordinary lower/mixed case data is safe.
    var UPPER_INDEX = {};
    for (var dictKey in DICT) {
        if (Object.prototype.hasOwnProperty.call(DICT, dictKey)) {
            var upperKey = dictKey.toUpperCase();
            if (UPPER_INDEX[upperKey] === undefined) {
                UPPER_INDEX[upperKey] = DICT[dictKey];
            }
        }
    }

    // Subtrees that must never be translated: SQL source, icon fonts, editors.
    var HARD_SKIP = [
        ".monaco-editor",
        ".codicon",
        "[data-wb-zh-skip]",
        "script",
        "style",
        "noscript",
        "textarea",
        "[contenteditable='true']",
    ].join(",");

    // The application renders both interface chrome and query results with
    // Tabulator, so class names alone cannot tell them apart. Tabulator still
    // emits a header element for headerless lists and marks it with
    // `tabulator-header-hidden` (display: none). A grid whose header is NOT
    // hidden carries data: column names and row values are user/database
    // content. A few containers are always data even without a header.
    var DATA_GRID_ID = /(result|output|preview|json|schema|tablename|tableschema|log)/i;
    var dataGridCache = new WeakMap();

    var isDataGrid = function (grid) {
        if (grid.id && DATA_GRID_ID.test(grid.id)) {
            return true;
        }
        var cached = dataGridCache.get(grid);
        if (cached !== undefined) {
            return cached;
        }
        var header = grid.querySelector(".tabulator-header");
        var isData = !!header && !header.classList.contains("tabulator-header-hidden");
        if (isData) {
            // Only positive results are cached: a grid can gain its header after
            // the first mutation batch.
            dataGridCache.set(grid, true);
        }

        return isData;
    };

    var shouldSkip = function (element) {
        if (!element || element.nodeType !== 1 || !element.closest) {
            return true;
        }
        if (element.closest(HARD_SKIP)) {
            return true;
        }
        var grid = element.closest(".tabulator");
        if (grid && isDataGrid(grid)) {
            return true;
        }

        return false;
    };

    var regexCache = PATTERNS.map(function (entry) {
        return [new RegExp(entry[0], entry[1]), entry[2]];
    });

    var resolveSkip = function (element, cache) {
        var cached = cache.get(element);
        if (cached !== undefined) {
            return cached;
        }
        var skipped = shouldSkip(element);
        cache.set(element, skipped);

        return skipped;
    };

    var textSkipCache = new WeakMap();
    var attrSkipCache = new WeakMap();

    var translateCore = function (core) {
        var hit = DICT[core];
        if (hit !== undefined) {
            return hit;
        }

        // "CONNECTIONS" and similar CSS-uppercased captions.
        if (core === core.toUpperCase() && /[A-Z]/.test(core)) {
            var upperHit = UPPER_INDEX[core];
            if (upperHit !== undefined) {
                return upperHit;
            }
        }

        // "Something:" / "Something..." / "Something >" prefixes and suffixes.
        var trailing = /^(.*?)(:\s*|\.\.\.|\u2026|\s*>\s*)$/.exec(core);
        if (trailing && DICT[trailing[1]] !== undefined) {
            var tail = trailing[2];
            if (tail.indexOf(":") >= 0) {
                return DICT[trailing[1]] + "\uFF1A";
            }
            if (tail.indexOf(">") >= 0) {
                return DICT[trailing[1]] + " >";
            }

            return DICT[trailing[1]] + "\u2026";
        }

        for (var i = 0; i < regexCache.length; i++) {
            var match = regexCache[i][0].exec(core);
            if (match) {
                return core.replace(regexCache[i][0], regexCache[i][1]);
            }
        }

        return undefined;
    };

    var translateText = function (value) {
        var match = /^(\s*)([\s\S]*?)(\s*)$/.exec(value);
        if (!match || !match[2]) {
            return value;
        }
        var translated = translateCore(match[2]);
        if (translated === undefined || translated === match[2]) {
            return value;
        }

        return match[1] + translated + match[3];
    };

    var translateTextNode = function (node) {
        if (!node || node.nodeType !== 3 || !node.nodeValue) {
            return;
        }
        var parent = node.parentNode;
        if (!parent || parent.nodeType !== 1 || resolveSkip(parent, textSkipCache)) {
            return;
        }
        var next = translateText(node.nodeValue);
        if (next !== node.nodeValue) {
            node.nodeValue = next;
            translatedCount++;
        }
    };

    var translateAttributes = function (element) {
        if (!element || element.nodeType !== 1 || resolveSkip(element, attrSkipCache)) {
            return;
        }
        for (var i = 0; i < ATTRIBUTES.length; i++) {
            var name = ATTRIBUTES[i];
            if (!element.hasAttribute || !element.hasAttribute(name)) {
                continue;
            }
            var value = element.getAttribute(name);
            if (!value) {
                continue;
            }
            var next = translateText(value);
            if (next !== value) {
                element.setAttribute(name, next);
                translatedCount++;
            }
        }
    };

    var translateSubtree = function (root) {
        if (!root) {
            return;
        }
        if (root.nodeType === 3) {
            translateTextNode(root);

            return;
        }
        if (root.nodeType !== 1) {
            return;
        }
        translateAttributes(root);
        translateTextNode(root.firstChild);
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        var current = walker.nextNode();
        while (current) {
            if (current.nodeType === 3) {
                translateTextNode(current);
            } else {
                translateAttributes(current);
            }
            current = walker.nextNode();
        }
    };

    var translatedCount = 0;

    var observer = new MutationObserver(function (records) {
        for (var i = 0; i < records.length; i++) {
            var record = records[i];
            if (record.type === "characterData") {
                translateTextNode(record.target);
            } else if (record.type === "attributes") {
                translateAttributes(record.target);
            } else {
                for (var j = 0; j < record.addedNodes.length; j++) {
                    translateSubtree(record.addedNodes[j]);
                }
            }
        }
    });

    var start = function () {
        if (!document.documentElement) {
            return;
        }
        translateSubtree(document.body || document.documentElement);
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ATTRIBUTES,
        });
    };

    window.__WB_ZH__ = {
        version: "1.0.0",
        entries: Object.keys(DICT).length,
        get translated() {
            return translatedCount;
        },
        rescan: function () {
            translateSubtree(document.body);
        },
        disable: function () {
            observer.disconnect();
            window.__WB_ZH_INSTALLED__ = false;
        },
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
        // The application mounts after DOMContentLoaded; observe immediately so
        // that nothing rendered in between is missed.
        if (document.documentElement) {
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ATTRIBUTES,
            });
        }
    } else {
        start();
    }
})();
