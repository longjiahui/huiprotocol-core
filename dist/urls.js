"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPaginationAPI = isPaginationAPI;
function API() {
    return class {
        constructor(path, options = {}) {
            this.path = path;
            this._type = "API";
            this._APIType = undefined;
            const { method } = Object.assign({
                method: "POST",
            }, options);
            this.method = method;
        }
    };
}
function PaginationAPI() {
    return class extends API() {
        constructor(path) {
            super(path);
            this._type = "PaginationAPI";
        }
    };
}
function isPaginationAPI(api) {
    return api._type === "PaginationAPI";
}
