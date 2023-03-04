import { getAgents } from "../../handlers/client-javascript/database/getAgents.js";
import { getInvestorTypes } from "../../handlers/client-javascript/database/getInvestorTypes.js";
import { getOverSubAllotmentPrinciple } from "../../handlers/client-javascript/database/getOverSubAllotmentPrinciple.js";
import { getAllInvestorInfo } from "../../handlers/client-javascript/database/investorInfo.js";
import { IssuertoLedger } from "../../handlers/client-javascript/functionality/addIssuerToLedger.js"
import { getIpoInfo } from "../../handlers/client-javascript/database/getIpo.js";
import { getAllotmentPrinciple } from "../../handlers/client-javascript/database/getAllotmentPrinciple.js";
import { getIpoBucket } from "../../handlers/client-javascript/database/getIpoBucket.js";
import { getInvestorClassification } from "../../handlers/client-javascript/database/getInvestorClassification.js";
import { updateIpoIdentifiers } from "../../handlers/client-javascript/functionality/updateIpoIdentifiers.js";


// ISSUER Controllers
export const launchIpo = async (req, res) => {
    let agents = await getAgents()
    let investor_types = await getInvestorTypes()
    let principles = await getOverSubAllotmentPrinciple()
    let investors = await getAllInvestorInfo()
    res.render("launch-ipo.jade", {
        role_id: req.user.role_id, principles: principles, agents: agents,
        investor_types: investor_types, investors: investors
    })
}

export const issuerDashboard = async (req, res) => {
    let ipoInfo = await getIpoInfo(req.user.user_id)
    var date = new Date(ipoInfo.bid_start_date)
    const yyyy = date.getFullYear();
    let mm = date.getMonth() + 1; // Months start at 0!
    let dd = date.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    const formattedDate = dd + '-' + mm + '-' + yyyy;
    let allotmentPrinciple = await getAllotmentPrinciple(ipoInfo.allotment_principle)
    let ipoBucket = await getIpoBucket(req.user.user_id)
    let investorClassification = await getInvestorClassification(req.user.user_id)

    res.render("issuer-dashboard.jade", {
        role_id: req.user.role_id, ipoInfo: ipoInfo, bid_start_date: formattedDate,
        allotment_principle: allotmentPrinciple.name,
        ipoBucket: ipoBucket, investorClassification: investorClassification
    });
}

export const postLaunchIpo = async (req, res) => {
    let data = JSON.parse(req.body['launch-ipo'])
    let user_id = req.user.user_id
    let buckets = []
    let investorClassifications = []
    let mapper = {
        investorTypeBucket: 'investor_type_id',
        BucketSize: 'no_of_shares',
        allocPriority: 'priority',
        investorId: 'investor_id',
        investorTypeClassification: 'investor_type_id',
        quota: 'reserve_lots',
        lotQuantity: 'min_lot_qty'
    }

    for (let i in data) {
        const splittedText = i.split("-");
        if (splittedText[1] !== undefined) {
            let a = investorClassifications
            if (['investorTypeBucket', 'BucketSize', 'allocPriority', 'investorId'].includes(splittedText[0])) {
                a = buckets
            }
            if (a[Number(splittedText[1])]) {
                a[Number(splittedText[1])][mapper[splittedText[0]]] = data[i]
            } else {
                let d = { ipo_id: user_id }
                d[mapper[splittedText[0]]] = data[i]
                a[Number(splittedText[1])] = d
            }
        }
    }

    let promiseInvoke = await IssuertoLedger(req.user.user_name, data.issuer, data.isin, data.cusip,
        data.ticker, data.totalShares, data.lowPrice, data.highPrice, data.ipoStartDate,
        data.ipoEndTime, data.lotSize, data.agent, data.principle, buckets, investorClassifications);


    let ipoInfo = await getIpoInfo(user_id)
    if (ipoInfo) {
        return res.redirect('/issuer/issuer-dashboard')
    }
    // Some error occured
    return res.redirect('back')


}

export const updateIssuer = async (req, res) => {
    let cusip = req.body.cusip
    let ticker = req.body.ticker
    let isin = req.body.isin
    try {
        let updateIpo = await updateIpoIdentifiers(req.user.user_name, isin, cusip, ticker)
    } catch (err) {
        // TODO: Add Flash message
        console.error(err)
    }

    return res.redirect('/issuer/issuer-dashboard')
    // let user_id = req.user.user_id
    // let ipoInfo = await getIpoInfo(user_id)
    // if (ipoInfo) {
    //     let template = "issuer-dashboard.jade"
    //     var date = new Date(ipoInfo.bid_start_date)
    //     const yyyy = date.getFullYear();
    //     let mm = date.getMonth() + 1; // Months start at 0!
    //     let dd = date.getDate();

    //     if (dd < 10) dd = '0' + dd;
    //     if (mm < 10) mm = '0' + mm;

    //     const formattedDate = dd + '-' + mm + '-' + yyyy;
    //     let allotmentPrinciple = await getAllotmentPrinciple(ipoInfo.allotment_principle)
    //     let ipoBucket = await getIpoBucket(user_id)
    //     let investorClassification = await getInvestorClassification(user_id)
    //     res.render(template, {
    //         session: req.session.name, role_id: role_id, ipoInfo: ipoInfo, bid_start_date: formattedDate,
    //         allotment_principle: allotmentPrinciple.name,
    //         ipoBucket: ipoBucket, investorClassification: investorClassification, message: updateIpo
    //     });
    // }
}

