import url from 'url';
import { v4 as uuidv4 } from 'uuid';
import db from '../../configurations/sqliteConnection.js';
import { getInvestorTypeId, getRoleTypeId } from '../../utils/index.js';
import { registerUserAgent } from "../../handlers/client-javascript/MSP/registerUserAgent.js";
import { registerUserInvestor } from "../../handlers/client-javascript/MSP/registerUserInvestor.js";
import { registerUserIssuer } from "../../handlers/client-javascript/MSP/registerUserIssuer.js";
import { getIpoInfo } from "../../handlers/client-javascript/database/getIpo.js";
import { getIdFromUsername } from '../../handlers/client-javascript/database/getUserId.js';

export const registerStep1 = (req, res) => {
    let role_type = [];
    db.all("select * from tbl_role_type", async (err, rows) => {
        if (err) {
            console.log(err)
        }
        else {
            rows.forEach(function (row) {
                role_type.push(
                    {
                        role_type_id: row.role_type_id,
                        role_type: row.role_type
                    })

            })
        }
        return res.render("register-step1.jade", { role_type: role_type })
    });
}

export const postRegisterStep1 = (req, res) => {
    let role_type = req.body.role_type_dropdown
    res.redirect(url.format({
        pathname: '/users/register-step2',
        query: {
            role: role_type
        }
    }))
}

export const registerStep2 = (req, res) => {
    res.render("register-step2.jade", {
        role: req.query.role
    })
}

export const postRegisterStep2 = async (req, res) => {
    let role = req.body.role.split("-");
    let role_type_id = role[0];

    let username = req.body.username;
    let password = req.body.password;
    let fullname = req.body.fullname;

    // let investor_type_id = null;
    let template;


    let investor_type_promise = await getInvestorTypeId(role[1])
    let investor_type_id = investor_type_promise['investor_type_id'];

    db.get(`SELECT * FROM tbl_user where user_name = ?`, [req.body.username], async (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            console.error(err)
            return;
        }
        else if (row) {
            // TODO: add flash messgae
            // message: username already exists
            res.redirect('back')
        }
        else {
            let user_id = uuidv4()
            let insert = 'INSERT INTO tbl_user (user_id,user_name, user_pwd,full_name) VALUES (?,?,?,?)';
            let insert2 = 'INSERT INTO tbl_userrole (user_id,role_id) VALUES (?,?)';
            try {
                if (role_type_id == 'IN') {
                    await registerUserInvestor(username);
                    template = "register-investor-step3.jade"
                }
                else if (role_type_id == 'IS') {
                    await registerUserIssuer(username)

                }
                else if (role_type_id == 'AG') {
                    await registerUserAgent(username)
                }
                // TODO: Implement Password Hashing
                db.run(insert, [user_id, username, password, fullname]);
                db.run(insert2, [user_id, role_type_id]);
                if (role_type_id == 'IN') {
                    return res.redirect(url.format({
                        pathname: '/users/register-step3',
                        query: {
                            investor_type_id: investor_type_id,
                            username: username
                        }
                    }))

                } else if (role_type_id == 'AG' || role_type_id == 'IS') {
                    return res.redirect('/users/login')
                }
                // res.render(template, { message: "Successfully registered!!", session: req.session.name, role_id: role_id, investor_type_id: investor_type_id, username: username });
            } catch (error) {
                console.error(error.message);
            }
        }
    });

}

export const registerInvestorStep3 = (req, res) => {

    res.render("register-investor-step3.jade", {
        investor_type_id: req.query.investor_type_id,
        username: req.query.username
    })
}

export const postRegisterInvestorStep3 = async (req, res) => {

    let acctnum = req.body.acctnum
    let ifsc = req.body.ifsc
    let acctholder = req.body.acctholder
    let pan = req.body.pan
    let dacctnum = req.body.dacctnum
    let dpartid = req.body.dpartid
    let investor_type_id = req.body.investor_type_id
    let username = req.body.username

    let user_promise = await getIdFromUsername(username);

    let user_id = null
    let full_name = null;
    if (user_promise) {
        user_id = user_promise['user_id'];
        full_name = user_promise['full_name'];
    }

    let insert_investor_info = 'INSERT INTO tbl_investor_info (investor_id,investor_type, pan,investor_name,bank_account_no,ifsc_code,lei,swift_address) VALUES (?,?,?,?,?,?,?,?)';
    let insert_investor_dmat = 'INSERT INTO tbl_investor_dmat (investor_id,demat_ac_no,dp_id) values(?,?,?)'

    let firstQueryError = ""
    db.run(insert_investor_info, [user_id, investor_type_id, pan, full_name, acctnum, ifsc], (err, response) => {
        if (err) {
            // TODO: give flash message
            console.error(err)
            firstQueryError = err
        }
    })
    db.run(insert_investor_dmat, [user_id, dacctnum, dpartid], (err, response) => {
        if (err || firstQueryError) {
            // TODO: give flash message
            console.error(err)
            return res.redirect(url.format({
                pathname: '/users/register-step3',
                query: {
                    investor_type_id: investor_type_id,
                    username: username
                }
            }))
        } else {
            return res.redirect('/users/login')
        }
    })


}

export const enroll = (req, res) => {
    res.render("enroll.jade", { session: req.session.name, role_id: role_id })
};

export const register = (req, res) => {
    res.render("register.jade", { session: req.session.name, role_id: role_id })
}

export const userInfo = async (req, res) => {

    var userinfo = []
    let user_promise = await getIdFromUsername(req.session.name);
    console.log("USER promise:- ", user_promise);

    let user_id, role_id;
    if (user_promise) {
        user_id = user_promise['user_id'];
        role_id = user_promise['role_id'];
    }
    else {
        user_id = null;
    }

    console.log(user_id, role_id)

    db.all(`select user_name,lots_bid,bid_amount,is_allotted from tbl_user 
        inner join tbl_investor_transactions
         on 
         tbl_user.user_id=tbl_investor_transactions.ipo_id 
         where investor_id='${user_id}'`, (err, rows) => {
        if (err) {
            console.log(err)
        }
        else {

            rows.forEach(function (row) {
                userinfo.push({
                    user_name: row.user_name,
                    lots_bid: row.lots_bid,
                    bid_amount: row.bid_amount,
                    is_allotted: row.is_allotted
                })


            })

        }
        console.log(userinfo)
        if (userinfo) {
            console.log(userinfo)
            res.render("userinfo.jade", { session: req.session.name, role_id: role_id, userinfo: userinfo })

        }



    });


}


export const logIn = (req, res) => {
    res.render("login.jade")
}

export const getRegisterAuthority = (req, res) => {
    res.render("registerauthority.jade", { session: req.session.name, role_id: role_id })
}

export const postRegisterauthority = (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    var role = req.body.authority;
    console.log(username, password, role)
    res.render("registerauthority.jade", { session: req.session.name, role_id: role_id })
}

export const postLogin = async (req, res) => {
    console.log("Insideeee LOgin");
    let template;
    let value;

    let role_id = req.user.role_id;
    if (role_id == "IN") {
        template = "ongoing-ipo.jade"
        req.session.name = req.body.username
        sess = req.session.name;
        var ongoing = await OngoingIpoInfo();
        console.log(ongoing);
        res.render(template, { session: req.session.name, role_id: role_id, ongoing: ongoing });
    }
    else if (role_id == "IS") {
        let ipoInfo = await getIpoInfo(req.user.user_id)
        if (ipoInfo) {
            return res.redirect('/issuer/issuer-dashboard')
            // template = "issuer-dashboard.jade"
            // console.log(ipoInfo)
            // console.log(ipoInfo.bid_start_date)
            // var date = new Date(ipoInfo.bid_start_date)
            // const yyyy = date.getFullYear();
            // let mm = date.getMonth() + 1; // Months start at 0!
            // let dd = date.getDate();

            // if (dd < 10) dd = '0' + dd;
            // if (mm < 10) mm = '0' + mm;

            // const formattedDate = dd + '-' + mm + '-' + yyyy;
            // console.log(formattedDate)
            // let allotmentPrinciple = await getAllotmentPrinciple(ipoInfo.allotment_principle)
            // let ipoBucket = await getIpoBucket(user_id)
            // console.log(ipoBucket)
            // let investorClassification = await getInvestorClassification(user_id)
            // console.log(investorClassification)
            // res.render(template, {
            //     session: req.session.name, role_id: role_id, ipoInfo: ipoInfo, bid_start_date: formattedDate,
            //     allotment_principle: allotmentPrinciple.name, ipoBucket: ipoBucket, investorClassification: investorClassification
            // });
        }
        else {
            return res.redirect('/issuer/launch-ipo')
        }
    }
    else if (role_id == "AG") {
        var promiseQuery = query(req.body.username);
        var promiseValue = async () => {
            value = await promiseQuery;
            console.log("IPO : ", value);
            template = "agent-dashboard.jade"
            console.log(role_id)
            req.session.name = req.body.username
            let sess = req.session.name;
            res.render(template, { session: req.session.name, role_id: role_id, data: value })

            // template="agent-dashboard.jade"

        }
        promiseValue();
    }

    return res.redirect('back')

}

export const logOut = (req, res) => {
    req.session.destroy(function (error) {
        console.log("Session Destroyed")
    })
    res.render("index.jade");
}

