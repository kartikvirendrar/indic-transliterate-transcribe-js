const { JSDOM } = require("jsdom");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
const def = (k, v) => Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
def("window", dom.window); def("document", dom.window.document); def("self", dom.window);
def("navigator", dom.window.navigator); def("HTMLElement", dom.window.HTMLElement);
def("Element", dom.window.Element); def("getComputedStyle", dom.window.getComputedStyle);
def("localStorage", dom.window.localStorage); def("IS_REACT_ACT_ENVIRONMENT", true);

const React = require("react");
const ReactDOM = require("react-dom");
const { act } = require("react-dom/test-utils");
const { IndicTransliterate } = require("./dist/index.js");

let fetchCount = 0;
def("fetch", async (url) => {
  if (String(url).includes("/xlit-api/")) fetchCount += 1;
  return { ok: true, status: 200, json: async () => ({ result: ["क"] }) };
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function typeWord({ word, gapMs, props }) {
  fetchCount = 0;
  const container = document.createElement("div"); document.body.appendChild(container);
  const Harness = () => {
    const [v, setV] = React.useState("");
    return React.createElement(IndicTransliterate, Object.assign({
      value: v, onChangeText: setV, lang: "hi", customApiURL: "http://x/api/v1/xlit-api/",
    }, props));
  };
  await act(async () => { ReactDOM.render(React.createElement(Harness), container); });
  const input = container.querySelector("input");
  const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
  for (let i = 1; i <= word.length; i++) {
    const next = word.slice(0, i);
    await act(async () => {
      setter.call(input, next);
      input.selectionStart = input.selectionEnd = next.length;
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    await act(async () => { await sleep(gapMs); });
  }
  await act(async () => { await sleep(400); });
  await act(async () => { ReactDOM.unmountComponentAtNode(container); });
  return fetchCount;
}

(async () => {
  const legacy = { suggestionDebounceMs: 0, minSuggestionWordLength: 1 };
  const out = {
    debounced_fast_60ms_gaps: await typeWord({ word: "kamal", gapMs: 60, props: {} }),
    debounced_slow_300ms_gaps: await typeWord({ word: "kamal", gapMs: 300, props: {} }),
    legacy_fast_60ms_gaps: await typeWord({ word: "kamal", gapMs: 60, props: legacy }),
    legacy_slow_300ms_gaps: await typeWord({ word: "kamal", gapMs: 300, props: legacy }),
  };
  console.log(JSON.stringify(out, null, 1));
})();
