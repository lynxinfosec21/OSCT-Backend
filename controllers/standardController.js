//User info Controllers
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

//standards
const cis_standard = require("../standards/cis_standard");

//Models
const Standard = require("../models/standardModal");

//@Benchmark information based on asset ip
//@ Req Get
//@URL : /api/standard/assetip
async function getAssetBenchmark(req, res) {
  try {
    const id = req.query.id;
    const data = await Standard.find({ _asset: id });
    return res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

//@Cis Benchmark Comparision Api
//@ Req POST
//@URL : /api/standard
async function cisStandard(req, res) {
  try {
    
    const AssetData = req.body;
    
    const resultObject = {};
    let totalScore = 0;
    let totalComplainceScore = 0;

    const upperCase = (arr) => {
      const newarr = [];
      for (let i = 0; i < arr.length; i++) {
        newarr.push(arr[i].toUpperCase());
      }
      return newarr;
    };

    let checkSubset = (parentArray, subsetArray) => {
      return subsetArray.every((el) => {
        return parentArray.includes(el);
      });
    };

    for (let ad in AssetData) {
      if (ad === "CIS Benchmark") {
        const adData = AssetData[ad];
        resultObject[ad] = AssetData[ad];
        for (let cis in adData) {
          resultObject[ad][cis] = adData[cis];
          const data = adData[cis];
          for (let key in data) {
            const finalData = data[key];

            if (typeof finalData === "number") {
              if (finalData === -1) {
                totalScore += 1;
                resultObject[ad][cis][key] = {
                  status: false,
                  value: finalData,
                  operator: cis_standard[key][0],
                  policy: cis_standard[key][1],
                };
              } else {
                if (
                  typeof finalData === "number" &&
                  typeof cis_standard[key][0]
                ) {
                  const status = cis_standard[key].includes(finalData);
                  if (status === true) {
                    totalScore += 1;
                    totalComplainceScore += 1;
                    resultObject[ad][cis][key] = {
                      status,
                      value: finalData,
                      operator: cis_standard[key][0],
                      policy: cis_standard[key][1],
                    };
                  } else {
                    totalScore += 1;
                    resultObject[ad][cis][key] = {
                      status,
                      value: finalData,
                      operator: cis_standard[key][0],
                      policy: cis_standard[key][1],
                    };
                  }
                } else {
                  if (cis_standard[key][0] === "=") {
                    if (finalData === cis_standard[key][1]) {
                      totalScore += 1;
                      totalComplainceScore += 1;
                      resultObject[ad][cis][key] = {
                        status: true,
                        value: finalData,
                        operator: cis_standard[key][0],
                        policy: cis_standard[key][1],
                      };
                    } else {
                      totalScore += 1;
                      resultObject[ad][cis][key] = {
                        status: false,
                        value: finalData,
                        operator: cis_standard[key][0],
                        policy: cis_standard[key][1],
                      };
                    }
                  } else if (cis_standard[key][0] === ">=") {
                    if (finalData > cis_standard[key][1]) {
                      totalScore += 1;
                      totalComplainceScore += 1;
                      resultObject[ad][cis][key] = {
                        status: true,
                        value: finalData,
                        operator: cis_standard[key][0],
                        policy: cis_standard[key][1],
                      };
                    } else {
                      totalScore += 1;
                      resultObject[ad][cis][key] = {
                        status: false,
                        value: finalData,
                        operator: cis_standard[key][0],
                        policy: cis_standard[key][1],
                      };
                    }
                  } else if (cis_standard[key][0] === "<=") {
                    if (finalData < cis_standard[key][1]) {
                      totalScore += 1;
                      totalComplainceScore += 1;
                      resultObject[ad][cis][key] = {
                        status: true,
                        value: finalData,
                        operator: cis_standard[key][0],
                        policy: cis_standard[key][1],
                      };
                    } else {
                      totalScore += 1;
                      resultObject[ad][cis][key] = {
                        status: false,
                        value: finalData,
                        operator: cis_standard[key][0],
                        policy: cis_standard[key][1],
                      };
                    }
                  }
                }
              }
            } else if (typeof finalData === "object") {
              for (let item in finalData) {
                const value = finalData[item];
                const type = typeof value;
                if (type === "string") {
                  const itemValue = value === "No One" ? "" : value;

                  if (Object.values(cis_standard[item]).includes(itemValue)) {
                    totalScore += 1;
                    totalComplainceScore += 1;
                    resultObject[ad][cis][key][item] = {
                      status: true,
                      value: itemValue,
                      policy: cis_standard[item],
                    };
                  } else if (cis_standard[item] === itemValue) {
                    totalScore += 1;
                    totalComplainceScore += 1;
                    resultObject[ad][cis][key][item] = {
                      status: true,
                      value: itemValue,
                      policy: cis_standard[item],
                    };
                  } else {
                    totalScore += 1;
                    resultObject[ad][cis][key][item] = {
                      status: false,
                      value: itemValue,
                      policy: cis_standard[item],
                    };
                  }
                } else if (type === "number") {
                  if (value === -1) {
                    totalScore += 1;
                    resultObject[ad][cis][key][item] = {
                      status: false,
                      value,
                      operator: cis_standard[item][0],
                      policy: cis_standard[item][1],
                    };
                  } else {
                    if (
                      typeof value === "number" &&
                      typeof cis_standard[item][0]
                    ) {
                      const status = cis_standard[item].includes(value);
                      if (status === true) {
                        totalScore += 1;
                        totalComplainceScore += 1;
                        resultObject[ad][cis][key][item] = {
                          status,
                          value,
                          operator: cis_standard[item][0],
                          policy: cis_standard[item][1],
                        };
                      } else {
                        totalScore += 1;
                        resultObject[ad][cis][key][item] = {
                          status,
                          value,
                          operator: cis_standard[item][0],
                          policy: cis_standard[item][1],
                        };
                      }
                    } else {
                      if (cis_standard[0] === "=") {
                        if (value === cis_standard[item][1]) {
                          totalScore += 1;
                          totalComplainceScore += 1;
                          resultObject[ad][cis][key][item] = {
                            status: true,
                            value,
                            operator: cis_standard[item][0],
                            policy: cis_standard[item][1],
                          };
                        } else {
                          totalScore += 1;
                          resultObject[ad][cis][key][item] = {
                            status: false,
                            value,
                            operator: cis_standard[item][0],
                            policy: cis_standard[item][1],
                          };
                        }
                      } else if (cis_standard[item][0] === ">=") {
                        if (value > cis_standard[item][1]) {
                          totalScore += 1;
                          totalComplainceScore += 1;
                          resultObject[ad][cis][key][item] = {
                            status: true,
                            value,
                            operator: cis_standard[item][0],
                            policy: cis_standard[item][1],
                          };
                        } else {
                          totalScore += 1;
                          resultObject[ad][cis][key][item] = {
                            status: false,
                            value,
                            operator: cis_standard[item][0],
                            policy: cis_standard[item][1],
                          };
                        }
                      } else if (cis_standard[item][0] === "<=") {
                        if (value < cis_standard[item][1]) {
                          totalScore += 1;
                          totalComplainceScore += 1;
                          resultObject[ad][cis][key][item] = {
                            status: true,
                            value,
                            operator: cis_standard[item][0],
                            policy: cis_standard[item][1],
                          };
                        } else {
                          totalScore += 1;
                          resultObject[ad][cis][key][item] = {
                            status: false,
                            value,
                            operator: cis_standard[item][0],
                            policy: cis_standard[item][1],
                          };
                        }
                      }
                    }
                  }
                } else if (type === "object") {
                  if (value.length === undefined) {
                    return;
                  }
                  const cisItem = upperCase(cis_standard[item]);
                  const itemValueUppercase = upperCase(value);
                  const status = checkSubset(cisItem, itemValueUppercase);
                  if (status === true) {
                    totalScore += 1;
                    totalComplainceScore += 1;
                    resultObject[ad][cis][key][item] = {
                      status,
                      key: item,
                      value: itemValueUppercase,
                      policy: cisItem,
                    };
                  } else {
                    totalScore += 1;
                    resultObject[ad][cis][key][item] = {
                      status,
                      key: item,
                      value: itemValueUppercase,
                      policy: cisItem,
                    };
                  }
                }
              }
            }
          }
        }
      } else {
        resultObject[ad] = AssetData[ad];
      }
    }

    const data = {
      totalComplainceScore,
      totalScore,
      assetIP: resultObject.IP,
      benchmark: resultObject,
      standard: "CIS Standard",
      _asset: resultObject.agent_id,
      assetToken: resultObject.token,
    };

    await Standard.create(data);

    return res.status(200).json({ message: "Data Added" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = { cisStandard, getAssetBenchmark };
