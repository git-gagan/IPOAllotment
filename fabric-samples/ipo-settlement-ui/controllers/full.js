export const home = (req, res) => {
  if (req.session.name) {
    res.render("index.jade", {
      session: req.session.name,
      role_id: role_id,
      toastContent: "",
    });
  } else {
    res.render("index.jade", {
      toastContent: "",
    });
  }
};

let app = {
  get: () => {},
  post: () => {},
};

/////////////////////////////////////////
// ACTIONS
app.get("/actionEnrollAdmin", function (req, res) {
  //var promiseEnrollAdmin = enrollAdmin.log();
  var promiseEnrollAdmin = enrollAdmin.enroll();
  var promiseValue = async () => {
    const value = await promiseEnrollAdmin;
    console.log(value);
    res.render("enroll.jade", {
      data: value,
      session: req.session.name,
      role: role_id,
    });
  };
  promiseValue();
});

app.get("/actionRegisterUser", function (req, res) {
  //var promiseRegisterUser = registerUser.log();
  var promiseRegisterUser = registerUser.register();
  var promiseValue = async () => {
    const value = await promiseRegisterUser;
    console.log(value);
    res.render("register.jade", {
      data: value,
      session: req.session.name,
      role: role_id,
    });
  };
  promiseValue();
});
// app.get('/actionInvoke', function (req, res){
//     //ar promiseInvoke = invoke.log();
//     var promiseInvoke = invokeTransaction(req.session.name);
//     var promiseValue = async () => {
//         const value = await promiseInvoke;
//         console.log(value);
//         res.render("invoke.jade", {data: value,session:req.session.name});
//     };
//     promiseValue();
// });
app.get("/actionQuery", function (req, res) {
  //var promiseQuery = query.log();
  var promiseQuery = queryTransaction(req.session.name);
  var promiseValue = async () => {
    const value = await promiseQuery;
    console.log(value);
    value.pop([Object.keys(value).length - 1]);
    console.log(value);
    res.render("query.jade", {
      data: value,
      session: req.session.name,
      role: role_id,
    });
  };
  promiseValue();
});

app.post("/add-demat", async function (req, res) {
  if (!req.session.name) {
    res.redirect("/login");
  }
  let dmat_ac_no = req.body.demataccno;
  let dp_id = req.body.dpid;
  let adddDemat = await addDemat(req.session.name, dmat_ac_no, dp_id);
  let user = await getIdFromUsername(req.session.name);
  console.log(user);
  let investor = await getInvestorInfo(user.user_id);
  console.log(investor);
  let demat = await getdemat(user.user_id);
  console.log(demat);
  var promiseQuery = query(req.session.name);
  var balance;
  var promiseValue = async () => {
    const value = await promiseQuery;
    console.log(value);

    try {
      balance = value[value.length - 1].Record.wallet.current_balance;
    } catch (err) {
      balance = 1000000;
    }
    res.render("profile.jade", {
      session: req.session.name,
      role_id: role_id,
      user: user,
      investor: investor,
      demat: demat,
      balance: balance,
    });
  };
  promiseValue();
});

app.get("/startBid", function (req, res) {
  var promiseQuery = startBid.startBid();
  var promiseInvoke = query.queryTransaction(req.session.name);
  var promiseValue = async () => {
    const value = await promiseQuery;
    const data = await promiseInvoke;
    console.log(value);
    res.render("issuerpanel.jade", {
      message: value,
      session: req.session.name,
      data: data,
      role: role_id,
    });
  };
  promiseValue();
});

app.get("/portfolio", function (req, res) {
  if (!req.session.name) {
    return res.redirect("/login");
  }
  var promiseQuery = query(req.session.name);
  console.log(promiseQuery);
  var portfolios;

  var promiseValue = async () => {
    const value = await promiseQuery;
    console.log("Value:-", value);
    portfolios = value[value.length - 1].Record.portfolio;
    console.log("Portfolios:-", portfolios);
    res.render("portfolio.jade", {
      session: req.session.name,
      role_id: role_id,
      portfolios: portfolios,
    });
  };
  promiseValue();
});

app.get("/balance", function (req, res) {
  var promiseQuery = query(req.session.name);
  var balance;
  var promiseValue = async () => {
    const value = await promiseQuery;
    console.log(value);

    try {
      balance = value[value.length - 1].Record.wallet.current_balance;
    } catch (err) {
      balance = 200000;
    }
    res.render("balance.jade", {
      session: req.session.name,
      balance: balance,
      role_id: role_id,
    });
  };
  promiseValue();
});

app.get("/invoke", function (req, res) {
  var share_id = req.query.id;
  res.render("invoke.jade", {
    session: req.session.name,
    role_id: role_id,
    id: share_id,
  });
});

app.get("/query", function (req, res) {
  res.render("query.jade", { session: req.session.name, role_id: role_id });
});

app.get("/signup", function (req, res) {
  res.render("signup.jade", { session: req.session.name, role_id: role_id });
});

app.get(
  "/issuerpanel",
  function (req, res) {
    // var promiseInvoke = query.queryTransaction(req.session.name);
    // var promiseValue = async () => {
    //     const value = await promiseInvoke;
    //     console.log(value);
    //     res.render("invoke.jade", {data: value,session:req.session.name});
    //     if (value != undefined && value.length > 0){
    //         res.render("issuerpanel.jade",{session:req.session.name,data: value})
    //     }else{
    //         res.render("issuerregister.jade",{session:req.session.name})
    //     }
    var agents = [];
    db.all(
      "select * from tbl_user where user_id in (select user_id from tbl_userrole where role_id='AG')",
      (err, rows) => {
        if (err) {
          console.log(err);
        } else {
          rows.forEach(function (row) {
            agents.push({
              user_id: row.user_id,
              user_name: row.user_name,
            });
          });
        }
        res.render("issuerpanel.jade", {
          session: req.session.name,
          role_id: role_id,
          agents: agents,
        });
      }
    );
  }
  // promiseValue();
);

app.post("/agentpanel", function (req, res) {
  var ipo_id = req.body.ipo;
  var promiseQuery = SharesAllotment(req.session.name, ipo_id);
  var promiseValue = async () => {
    const value = await promiseQuery;
    console.log(value);
    res.render("agentpanel.jade", {
      session: req.session.name,
      role_id: role_id,
      message: value,
    });
  };
  promiseValue();
  // res.render("agentpanel.jade",{session:req.session.name,role:role_id})
});

app.get("/ipo", function (req, res) {
  var promiseQuery = query(req.session.name);
  var promiseValue = async () => {
    const value = await promiseQuery;
    console.log(value);
    res.render("ipo.jade", {
      session: req.session.name,
      data: value,
      role_id: role_id,
      message: "",
    });
  };
  promiseValue();
});

app.post("/issuerpanel", function (req, res) {
  var ipo = req.body.ipo;
  var totalSize = req.body.totalSize;
  var priceRangeLow = req.body.priceRangeLow;
  var priceRangeHigh = req.body.priceRangeHigh;
  var bidStartDate = req.body.bidStartDate;
  var totalBidTime = req.body.totalBidTime;
  var lotSize = req.body.lotSize;
  var agent = req.body.agent;

  var value;
  console.log(
    ipo,
    totalSize,
    priceRangeLow,
    priceRangeHigh,
    bidStartDate,
    totalBidTime,
    agent
  );
  var promiseInvoke = IssuertoLedger(
    req.session.name,
    ipo,
    totalSize,
    priceRangeLow,
    priceRangeHigh,
    bidStartDate,
    totalBidTime,
    lotSize,
    agent
  );

  var promiseValue = async () => {
    value = await promiseInvoke;
    console.log(value);
    // res.render("invoke.jade", {data: value,session:req.session.name});
    // if (value != undefined && value.length > 0){
    //     res.render("issuerpanel.jade",{session:req.session.name,data: value})
    // }else{
    //     res.render("issuerregister.jade",{session:req.session.name})
    // }

    // res.render("issuerpanel.jade",{session:req.session.name,role:role_id,data:value})
    res.redirect("/ipo");
  };
  promiseValue();
});

app.get("/agentpanel", function (req, res) {
  var promiseQuery = query(req.session.name);
  var promiseValue = async () => {
    const value = await promiseQuery;
    console.log(value);
    res.render("agentpanel.jade", {
      session: req.session.name,
      data: value,
      role_id: role_id,
      message: "",
    });
  };
  promiseValue();
});

app.post("/actionInvoke", function (req, res) {
  var lotQuantity = req.body.lotQuantity;
  var bidperShare = req.body.bidperShare;
  var shareId = req.body.custId;

  console.log("lot quantity:", lotQuantity);
  console.log("bid per share:", bidperShare);
  console.log("Share Id:", shareId);

  var promiseInvoke = invokeTransaction(
    req.session.name,
    lotQuantity,
    bidperShare,
    shareId
  );
  var promiseValue = async () => {
    const value = await promiseInvoke;
    console.log(value);
    res.render("invoke.jade", {
      data: value,
      session: req.session.name,
      role_id: role_id,
    });
  };
  promiseValue();
});

app.get("/profile", async function (req, res) {
  console.log("Request Object Session Name:- ", req.session.name);
  if (!req.session.name) {
    console.log("Redirect to LOGIN");
    return res.redirect("/login");
  }
  let user = await getIdFromUsername(req.session.name);
  console.log(user);
  let investor = await getInvestorInfo(user.user_id);
  console.log(investor);
  let demat = await getdemat(user.user_id);
  console.log(demat);
  var promiseQuery = query(req.session.name);
  var balance;
  var promiseValue = async () => {
    const value = await promiseQuery;
    console.log(value);

    try {
      balance = value[value.length - 1].Record.wallet.current_balance;
    } catch (err) {
      balance = 1000000;
    }
    res.render("profile.jade", {
      session: req.session.name,
      role_id: role_id,
      user: user,
      investor: investor,
      demat: demat,
      balance: balance,
    });
  };
  promiseValue();
});

app.get("/holdings", function (req, res) {
  res.render("holdings.jade", { session: req.session.name, role_id: role_id });
});

app.get("/agent-dashboard", function (req, res) {
  var promiseQuery = query(req.session.name);
  var promiseValue = async () => {
    const value = await promiseQuery;
    console.log("IPO : ", value);
    res.render("agent-dashboard.jade", {
      session: req.session.name,
      role_id: role_id,
    });
  };
  promiseValue();
});

app.post("/agent-dashboard", function (req, res) {
  var ipo_id = req.body.ipo;
  var action = req.body.action;
  if (action == "1") {
    var promiseQuery = ipoAllotment(req.session.name, ipo_id);
    var promiseValue = async () => {
      const value = await promiseQuery;
      console.log(value);
      res.render("agent-dashboard.jade", {
        session: req.session.name,
        role_id: role_id,
        message: value,
      });
    };
    promiseValue();
  }
});

var investor_categories = [];
app.post("/add-investor-category", async function (req, res) {
  let investor_type = req.body.investorType;
  let quota = req.body.quota;
  let lot_quantity = req.body.lotQuantity;

  let user_promise = await getIdFromUsername(req.session.name);
  let user_id = user_promise["user_id"];

  investor_categories.push({
    ipo_id: user_id,
    investor_type_id: investor_type,
    min_lot_qty: lot_quantity,
    reserve_lots: quota,
  });

  console.log("Investor Categories", investor_categories);

  var agents = await getAgents();
  console.log(agents);

  var investor_types = await getInvestorTypes();
  console.log(investor_types);

  var principles = await getOverSubAllotmentPrinciple();
  console.log(principles);

  var investors = await getAllInvestorInfo();
  console.log(investors);

  res.render("launch-ipo.jade", {
    session: req.session.name,
    role_id: role_id,
    principles: principles,
    agents: agents,
    investor_types: investor_types,
    investors: investors,
  });
});

var ipo_buckets = [];
app.post("/add-ipo-buckets", async function (req, res) {
  let investor_type = req.body.investorTypeBucket;
  let bucket_size = req.body.BucketSize;
  let alloc_priority = req.body.allocPriority;
  let investor_id = req.body.investorId;
  let user_promise = await getIdFromUsername(req.session.name);
  let user_id = user_promise["user_id"];
  ipo_buckets.push({
    ipo_id: user_id,
    investor_type_id: investor_type,
    no_of_shares: bucket_size,
    priority: alloc_priority,
    investor_id: investor_id,
  });

  console.log("IPO Buckets", ipo_buckets);

  var agents = await getAgents();
  console.log(agents);

  var investor_types = await getInvestorTypes();
  console.log(investor_types);

  var principles = await getOverSubAllotmentPrinciple();
  console.log(principles);

  var investors = await getAllInvestorInfo();
  console.log(investors);

  res.render("launch-ipo.jade", {
    session: req.session.name,
    role_id: role_id,
    principles: principles,
    agents: agents,
    investor_types: investor_types,
    investors: investors,
  });
});

app.get("/ongoing-ipo", async function (req, res) {
  let ongoing = await OngoingIpoInfo();
  console.log(ongoing);

  res.render("ongoing-ipo.jade", {
    session: req.session.name,
    role_id: role_id,
    ongoing: ongoing,
  });
});

app.get("/applied-ipo", async function (req, res) {
  if (!req.session.name) {
    return res.redirect("/login");
  }
  let user = await getIdFromUsername(req.session.name);
  console.log(user);

  let investor_transactions = await getInvestorTransactions(user.user_id);
  console.log(investor_transactions);

  res.render("applied-ipo.jade", {
    session: req.session.name,
    role_id: role_id,
    user: user,
    investor_transactions: investor_transactions,
  });
});

app.post("/modify-bid", async function (req, res) {
  let transaction_id = req.body.modify_transaction_id;
  let bid_amount = req.body.bid_amount;
  let lots_applied = req.body.lots_applied;

  let modify_bid = await modifyBid(
    req.session.name,
    transaction_id,
    lots_applied,
    bid_amount
  );
  console.log(modify_bid);

  res.redirect("/ongoing-ipo");
});

app.post("/delete-bid", async function (req, res) {
  let transaction_id = req.body.delete_transaction_id;

  let delete_bid = await deleteBid(req.session.name, transaction_id);
  console.log(delete_bid);

  res.redirect("/ongoing-ipo");
});

app.post("/apply", async function (req, res) {
  if (!req.session.name) {
    return res.redirect("/login");
  }
  let ipo_id = req.body.ipo_id;
  console.log(ipo_id);
  var ipo = await getIpoInfo(ipo_id);
  console.log(ipo);
  let user = await getIdFromUsername(req.session.name);
  console.log(user);
  let demat = await getdemat(user.user_id);
  console.log(demat);
  res.render("apply-ipo.jade", {
    session: req.session.name,
    role_id: role_id,
    ipo: ipo,
    demat: demat,
  });
});

app.get("/apply-ipo", async function (req, res) {
  if (!req.session.name) {
    return res.redirect("/login");
  }
  let user = await getIdFromUsername(req.session.name);
  console.log(user);
  let demat = await getdemat(user.user_id);
  console.log(demat);
  res.render("apply-ipo.jade", {
    session: req.session.name,
    role_id: role_id,
    demat: demat,
  });
});

app.post("/apply-ipo", async function (req, res) {
  let demat = req.body.demat;
  let qty = req.body.qty;
  let price = req.body.price;
  let ipo_id = req.body.ipo_id;
  console.log(demat, qty, price);
  var Buy = await invokeBuy(req.session.name, ipo_id, demat, qty, price);
  console.log(Buy);
  let ongoing = await OngoingIpoInfo();
  console.log(ongoing);
  res.render("ongoing-ipo.jade", {
    session: req.session.name,
    role_id: role_id,
    ongoing: ongoing,
  });
});

app.get("/upcoming-ipo", async function (req, res) {
  let upcoming = await UpcomingIpoInfo();
  console.log(upcoming);
  res.render("upcoming-ipo.jade", {
    session: req.session.name,
    role_id: role_id,
    upcoming: upcoming,
  });
});
