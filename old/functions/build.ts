import { Webpage } from "./interfaces";

export default function build(tab: Webpage, elem: string) {
    return tab.evaluateJavaScript(`function() {
        document.querySelector('[id^=main_buildlink_${elem}]:not([id$=cheap])').click();
    }`);
}