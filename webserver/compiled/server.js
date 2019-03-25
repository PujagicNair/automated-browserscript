"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bodyParser = __importStar(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path = __importStar(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const express_socket_io_session_1 = __importDefault(require("express-socket.io-session"));
const cookie_session_1 = __importDefault(require("cookie-session"));
const http_1 = require("http");
const socket_io_1 = __importDefault(require("socket.io"));
const router_1 = __importDefault(require("./Handlers/router"));
const auth_1 = require("./Handlers/auth");
const user_1 = require("./user");
const api_1 = require("./hack/api");
(async () => {
    let app = express_1.default();
    let http = new http_1.Server(app);
    global.io = socket_io_1.default(http);
    global.sockets = {};
    let mongodb = await mongoose_1.default.connect('mongodb://localhost:27017/tribal', { useNewUrlParser: true });
    global.connection = mongodb.connection;
    user_1.createUserModel();
    if (process.argv[2] == '--prod') {
        await global.connection.dropDatabase();
        console.log('droped database');
    }
    api_1.TribalHackApi.setup();
    let sess = cookie_session_1.default({
        name: 'session',
        keys: ['hello', 'mi name', 'arber'],
        maxAge: 9999 * 60 * 60 * 1000
    });
    app.use(cookie_parser_1.default());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(sess);
    global.io.use(express_socket_io_session_1.default(sess, cookie_parser_1.default()));
    app.use(auth_1.Auth.handler());
    app.use(router_1.default.handler());
    app.use(express_1.default.static(path.join(__dirname, 'public')));
    app.get('**', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
    http.listen(80);
})();
