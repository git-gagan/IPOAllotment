import { ipoAllotment } from "../../handlers/client-javascript/functionality/ipoAllotment.js";
import { query } from "../../handlers/client-javascript/functionality/query.js"

export const agentDashboard = async (req, res) => {
    let session = req.user;
    if (!session) {
        console.log("Redirect to LOGIN");
        return res.redirect('/users/login');
    }
    let value = await query(req.user.user_name);
    console.log("IPO : ", value);
    let template = "agent-dashboard.jade";
    res.render(template, { session: req.user.user_name, role_id: req.user.role_id, data: value })
}

export const agentDashboardPost = async (req, res) => {
    let session = req.user;
    if (!session) {
        console.log("Redirect to LOGIN");
        return res.redirect('/users/login');
    }
    let ipo_id = req.body.ipo;
    let action = req.body.action;
    console.log(ipo_id, action);
    if (action == "1") {
        let value = await ipoAllotment(req.user.user_name, ipo_id);
        console.log(value);
        res.render("agent-dashboard.jade", { session: req.user.user_name, role_id: req.user.role_id, message: value});
    }
    else{
        let value = await query(req.user.user_name);
        let ipoSpecificInfo = null
        for(let v in value){
            if(value[v].Key == ipo_id){
                console.log("Found ipo specific info")
                ipoSpecificInfo = value[v];
                break;
            }
        }
        console.log(ipoSpecificInfo);
        res.render("agent-dashboard.jade", { session: req.user.user_name, role_id: req.user.role_id, escrow_info: ipoSpecificInfo, data: value});
    }
}