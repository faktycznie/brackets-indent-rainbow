/*
 * The MIT License (MIT)
 * Copyright (c) 2017 Artur Kaczmarek. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */
/*jslint vars: true, plusplus: true, devel: true, regexp: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $ */
define(function (require, exports, module) {
    "use strict";
    // Brackets modules
    var PreferencesManager = brackets.getModule("preferences/PreferencesManager")
        , Menus = brackets.getModule("command/Menus")
        , Editor = brackets.getModule("editor/Editor").Editor
        , EditorManager = brackets.getModule("editor/EditorManager")
        , AppInit = brackets.getModule("utils/AppInit")
        , CommandManager = brackets.getModule("command/CommandManager")
        , MainViewManager = brackets.getModule("view/MainViewManager");
    // Constants
    var COMMAND_NAME = "Indent Rainbow"
        , COMMAND_ID = "indent-rainbow.toggleIndent";
    // Define extension preferences
    var enabled = false
        , tab1color = "rgba(0, 128, 0, 0.15)"
        , tab2color = "rgba(255, 165, 0, 0.15)"
        , tab3color = "rgba(255, 0, 0, 0.15)"
        , tab4color = "rgba(238, 130, 238, 0.15)"
        , bgopacity = 1
        , prefs = PreferencesManager.getExtensionPrefs("brackets-indent-rainbow");
    prefs.definePreference("enabled", "boolean", enabled, {
        description: "If the value of this preference is true, Indent Rainbow will be visible, otherwise will be hidden."
    });
    prefs.definePreference("tab1color", "string", tab1color, {
        description: "The background color of the indent. Can be any valid CSS Color value."
    });
    prefs.definePreference("tab2color", "string", tab2color, {
        description: "The background color of the indent. Can be any valid CSS Color value."
    });
    prefs.definePreference("tab3color", "string", tab3color, {
        description: "The background color of the indent. Can be any valid CSS Color value."
    });
    prefs.definePreference("tab4color", "string", tab4color, {
        description: "The background color of the indent. Can be any valid CSS Color value."
    });
    prefs.definePreference("bgopacity", "string", bgopacity, {
        description: "The background opacity. Can be the number between 0.00 - 1."
    });

    function updateStyleRules() {
        if ($("#indent-rainbow-css").length) {
            $("#indent-rainbow-css").remove();
        }
        var cssStr = ".cm-rainbow-indent1{background:" + tab1color + "}";
        cssStr += ".cm-rainbow-indent2{background:" + tab2color + "}";
        cssStr += ".cm-rainbow-indent3{background:" + tab3color + "}";
        cssStr += ".cm-rainbow-indent4{background:" + tab4color + "}";
        cssStr += ".cm-rainbow-indent1,.cm-rainbow-indent2,.cm-rainbow-indent3,.cm-rainbow-indent4{";
        cssStr += "opacity:" + bgopacity + "}";
        $("<style id='indent-rainbow-css'>").text(cssStr).appendTo("head");
    }
    // CodeMirror overlay code
    var count = 0
        , reset = false
        , spaceClass = "rainbow-space rainbow-indent"
        , tabClass = "rainbow-tab rainbow-indent"
        , spaceUnits = Editor.getSpaceUnits()
        , indentGuidesOverlay = {
            token: function (stream, state) {
                var sign = 0
                    , tabStart = false;
                sign = stream.next();
                tabStart = (stream.column() % spaceUnits) ? false : true;
                if (reset) {
                    count = 0;
                    reset = false;
                }
                if (stream.eol()) {
                    reset = true;
                }
                if (sign === "\t") { //tabs
                    if (count === 4) {
                        count = 0;
                    }
                    count++;
                    return tabClass + count;
                }
                else if (sign === " ") { //space
                    if (tabStart) {
                        if (count === 4) {
                            count = 0;
                        }
                        count++;
                    }
                    return spaceClass + count;
                }
                else {
                    stream.skipToEnd();
                    count = 0;
                    return null;
                }
            }
            , flattenSpans: false
        };

    function applyPreferences() {
        enabled = prefs.get("enabled");
        tab1color = prefs.get("tab1color");
        tab2color = prefs.get("tab2color");
        tab3color = prefs.get("tab3color");
        tab4color = prefs.get("tab4color");
        bgopacity = prefs.get("bgopacity");
        updateStyleRules();
    }

    function updateUI() {
        var editor = EditorManager.getCurrentFullEditor()
            , cm = editor ? editor._codeMirror : null;
        // Update CodeMirror overlay if editor is available
        if (cm) {
            cm.removeOverlay(indentGuidesOverlay);
            if (enabled) {
                cm.addOverlay(indentGuidesOverlay);
                updateStyleRules();
            }
            cm.refresh();
        }
        // Update menu
        CommandManager.get(COMMAND_ID).setChecked(enabled);
    }
    // Event handlers
    function handleToggleGuides() {
        enabled = !enabled;
        prefs.set("enabled", enabled);
        prefs.save();
    }
    // Initialize extension
    AppInit.appReady(function () {
        // Register command and add to menu
        CommandManager.register(COMMAND_NAME, COMMAND_ID, handleToggleGuides);
        Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(COMMAND_ID);
        // Set up event listeners
        prefs.on("change", function () {
            applyPreferences();
            updateUI();
        });
        MainViewManager.on("currentFileChange", updateUI);
        // Apply preferences and draw indent
        applyPreferences();
        updateUI();
    });
});
