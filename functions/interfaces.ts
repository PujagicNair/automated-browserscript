import { WebPage } from "phantom";

// interfaces
export interface anyElement extends HTMLElement {
    [key: string]: any;
}

export interface Webpage extends WebPage {
    evaluateJavaScript<T = any>(script: string): Promise<T>;
}