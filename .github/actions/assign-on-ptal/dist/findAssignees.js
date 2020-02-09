"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function findAssignees(body) {
    let result = [];
    let lines = body.split('\r\n');
    let m, n;
    const reg1 = /(@[a-zA-Z0-9\-]+[\s\W]+)+[p|P][t|T][a|A][l|L]\s*/mg;
    const reg2 = /@([a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38})/mg;
    lines.forEach(l => {
        while ((m = reg1.exec(l)) !== null) {
            if (m.index === reg1.lastIndex) {
                reg1.lastIndex++;
            }
            while ((n = reg2.exec(m[0])) !== null) {
                if (n.index === reg2.lastIndex) {
                    reg2.lastIndex++;
                }
                result.push(n[1]);
            }
        }
    });
    console.log("Assigning these members: " + result);
    return result;
}
exports.findAssignees = findAssignees;
