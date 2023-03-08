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