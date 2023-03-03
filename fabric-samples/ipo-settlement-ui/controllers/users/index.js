import db from '../../configurations/sqliteConnection.js'
import url from 'url'
import { getRoleTypeId, getInvestorTypeId } from '../../utils/index.js'

export const registerStep1 = (req, res) => {
    let role_type = [];
    db.all("select * from tbl_role_type", (err, rows) => {
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
        res.render("register-step1.jade", { role_type: role_type })
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
    let role_type = req.body.role;
    let username = req.body.username;
    let password = req.body.password;
    let fullname = req.body.fullname;
    let role_type_id = null;
    let investor_type_id = null;
    let template;



    let role_type_promise = await getRoleTypeId(role_type)
    if (role_type_promise) {
        role_type_id = role_type_promise['role_type_id'];
    }

    let investor_type_promise = await getInvestorTypeId(role_type)
    if (investor_type_promise) {
        investor_type_id = investor_type_promise['investor_type_id'];
    }

    // console.log(role_type)
    db.get(`SELECT * FROM tbl_user where user_name = ?`, [req.body.username], (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            console.log(error.message);
            return;
        }
        else if (row) {
            res.render("register-step2.jade", { message: "Username already exist" });
        }
        else {
            let user_id = uuidv4()
            console.log(username, password, fullname)
            var promiseRegister, filepath;
            let insert = 'INSERT INTO tbl_user (user_id,user_name, user_pwd,full_name) VALUES (?,?,?,?)';
            let insert2 = 'INSERT INTO tbl_userrole (user_id,role_id) VALUES (?,?)';

            try {

                if (role_type_id == 'IN') {

                    promiseRegister = registerUserInvestor(username);
                    template = "register-investor-step3.jade"


                }
                else if (role_type_id == 'IS') {
                    promiseRegister = registerUserIssuer(username)
                    template = "login.jade"

                }
                else if (role_type_id == 'AG') {
                    promiseRegister = registerUserAgent(username)
                    template = "login.jade"


                }

                var promiseValue = async () => {
                    const value = await promiseRegister;

                };
                promiseValue();

                db.run(insert, [user_id, username, password, fullname]);

                db.run(insert2, [user_id, role_type_id]);
                console.log(template)
                console.log("Investor Type Id:", investor_type_id)
                res.render(template, { message: "Successfully registered!!", session: req.session.name, role_id: role_id, investor_type_id: investor_type_id, username: username });

            } catch (error) {
                console.log(error.message);
            }

        }

    });

}

export const registerInvestorStep3 = (req, res) => {
    res.render("register-investor-step3.jade", { session: req.session.name, role_id: role_id })
}

export const postRegisterInvestorStep3 = async (req, res) => {
    let acctnum, ifsc, acctholder, pan, dacctnum, dpartid, investor_type_id, username, full_name
    acctnum = req.body.acctnum
    ifsc = req.body.ifsc
    acctholder = req.body.acctholder
    pan = req.body.pan
    dacctnum = req.body.dacctnum
    dpartid = req.body.dpartid
    investor_type_id = req.body.investor_type_id
    username = req.body.username


    let user_promise = await getIdFromUsername(username);
    console.log("USER promise:- ", user_promise);

    let user_id, user_name;
    if (user_promise) {
        user_id = user_promise['user_id'];
        full_name = user_promise['full_name'];
    }
    else {
        user_id = null;
        full_name = null;
    }




    console.log(user_id)
    console.log(investor_type_id)
    console.log(full_name)

    let insert_investor_info = 'INSERT INTO tbl_investor_info (investor_id,investor_type, pan,investor_name,bank_account_no,ifsc_code,lei,swift_address) VALUES (?,?,?,?,?,?,?,?)';
    let insert_investor_dmat = 'INSERT INTO tbl_investor_dmat (investor_id,demat_ac_no,dp_id) values(?,?,?)'
    let id = uuidv4()

    db.run(insert_investor_info, [user_id, investor_type_id, pan, full_name, acctnum, ifsc])
    db.run(insert_investor_dmat, [user_id, dacctnum, dpartid])
    res.render("login.jade", { session: req.session.name, role_id: role_id })

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

export const signUp = (req, res) => {
    console.log(req.body);
    var username = req.body.username
    var password = req.body.password
    var identity = req.body.identity
    console.log("Identity :", identity)
    db.get(`SELECT * FROM tbl_user where user_name = ?`, [req.body.username], (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            console.log(error.message);
            return;
        }
        else if (row) {
            res.render("signup.jade", { message: "Username already exist", session: req.session.name, role_id: role_id });
        }
        else {
            let user_id = uuidv4()
            var promiseRegister, filepath;
            let insert = 'INSERT INTO tbl_user (user_id,user_name, user_pwd) VALUES (?,?,?)';
            let insert2 = 'INSERT INTO tbl_userrole (user_id,role_id) VALUES (?,?)';

            try {

                if (identity == 'IN') {
                    promiseRegister = registerUserInvestor(username);

                }
                else if (identity == 'IS') {
                    promiseRegister = registerUserIssuer(username)

                }
                else if (identity == 'AG') {
                    promiseRegister = registerUserAgent(username)


                }

                var promiseValue = async () => {
                    const value = await promiseRegister;

                };
                promiseValue();

                db.run(insert, [user_id, username, password]);
                db.run(insert2, [user_id, identity]);

                res.render("login.jade", { message: "Successfully registered!!", session: req.session.name, role_id: role_id });

            } catch (error) {
                console.log(error.message);
            }

        }

    });

}

export const logIn = (req, res) => {
    res.render("login.jade", { session: req.session.name, role_id: role_id })
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
    var data;
    var template;
    var value;
    // TODO: Implement Password Hashing
    // TODO: Use PassportJS for authentication
    db.get(`SELECT * FROM tbl_user where user_name = ? and user_pwd = ?`, [req.body.username, req.body.password], async (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            console.error(error.message);
            return;
        }
        else if (row) {
            let user_promise = await getIdFromUsername(req.body.username);
            if (user_promise) {
                role_id = user_promise['role_id'];
                if (role_id == "IN") {
                    template = "ongoing-ipo.jade"
                    req.session.name = req.body.username
                    sess = req.session.name;
                    var ongoing = await OngoingIpoInfo();
                    console.log(ongoing);
                    res.render(template, { session: req.session.name, role_id: role_id, ongoing: ongoing });
                }
                else if (role_id == "IS") {
                    req.session.name = req.body.username
                    sess = req.session.name;
                    let user_id = user_promise["user_id"]
                    let ipoInfo = await getIpoInfo(user_id)
                    if (ipoInfo) {
                        template = "issuer-dashboard.jade"
                        console.log(ipoInfo)
                        console.log(ipoInfo.bid_start_date)
                        var date = new Date(ipoInfo.bid_start_date)
                        const yyyy = date.getFullYear();
                        let mm = date.getMonth() + 1; // Months start at 0!
                        let dd = date.getDate();

                        if (dd < 10) dd = '0' + dd;
                        if (mm < 10) mm = '0' + mm;

                        const formattedDate = dd + '-' + mm + '-' + yyyy;
                        console.log(formattedDate)
                        let allotmentPrinciple = await getAllotmentPrinciple(ipoInfo.allotment_principle)
                        let ipoBucket = await getIpoBucket(user_id)
                        console.log(ipoBucket)
                        let investorClassification = await getInvestorClassification(user_id)
                        console.log(investorClassification)
                        res.render(template, {
                            session: req.session.name, role_id: role_id, ipoInfo: ipoInfo, bid_start_date: formattedDate,
                            allotment_principle: allotmentPrinciple.name, ipoBucket: ipoBucket, investorClassification: investorClassification
                        });
                    }
                    else {
                        res.redirect('/launch-ipo')

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
                        sess = req.session.name;
                        res.render(template, { session: req.session.name, role_id: role_id, data: value })

                        // template="agent-dashboard.jade"

                    }
                    promiseValue();
                }
            }
            else {
                role_id = null;
            }
        }
        else {
            res.render("login.jade", { message: "please fill out correct details", session: req.session.name, role_id: role_id });
        }

    });
}

export const logOut = (req, res) => {
    req.session.destroy(function (error) {
        console.log("Session Destroyed")
    })
    res.render("index.jade");
}

