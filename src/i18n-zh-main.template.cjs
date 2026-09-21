/*
 * MySQL Workbench 简体中文语言包 - 主进程模块
 * MySQL Workbench Simplified Chinese language pack - main process module.
 *
 * Translates Electron menu labels and a few dialog strings. It never touches
 * menu item ids, accelerators, roles or file names, so behaviour is unchanged.
 */
"use strict";

const DICT = __DICT__;

const LOOKS_LIKE_PATH = /[\\/]|\.[a-z0-9]{1,6}$/i;

const translateLabel = (label) => {
    if (typeof label !== "string" || label.length === 0) {
        return label;
    }
    if (LOOKS_LIKE_PATH.test(label)) {
        return label;
    }

    const direct = DICT[label];
    if (direct !== undefined) {
        return direct;
    }

    const trailing = /^(.*?)(:\s*|\.\.\.|\u2026)$/.exec(label);
    if (trailing && DICT[trailing[1]] !== undefined) {
        if (trailing[2].indexOf(":") >= 0) {
            return `${DICT[trailing[1]]}\uFF1A`;
        }
        if (trailing[2] === "...") {
            return `${DICT[trailing[1]]}...`;
        }

        return `${DICT[trailing[1]]}\u2026`;
    }

    return label;
};

// Menu templates coming from the renderer carry both ids and labels; only the
// label field is rewritten. `role` items keep Electron's own localized labels.
const translateMenuTemplate = (items) => {
    if (!Array.isArray(items)) {
        return items;
    }

    return items.map((item) => {
        if (!item || typeof item !== "object") {
            return item;
        }

        const next = { ...item };
        if (typeof next.label === "string" && next.role === undefined) {
            next.label = translateLabel(next.label);
        }
        if (Array.isArray(next.submenu)) {
            next.submenu = translateMenuTemplate(next.submenu);
        }

        return next;
    });
};

module.exports = {
    translateLabel,
    translateMenuTemplate,
    dictionarySize: Object.keys(DICT).length,
};
