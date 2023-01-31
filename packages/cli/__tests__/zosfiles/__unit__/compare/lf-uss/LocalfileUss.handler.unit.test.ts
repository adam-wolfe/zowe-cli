/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import { Get } from "@zowe/zos-files-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { DiffUtils, IDiffOptions } from "@zowe/imperative";
import { readFileSync } from "fs";

describe("Compare local-file and uss-file handler", () => {
    describe("process method", () => {
        // Require the handler and create a new instance
        const handlerReq = require("../../../../../src/zosfiles/compare/lf-uss/LocalfileUss.handler");
        const handler = new handlerReq.default();
        // any local repo file
        const localFilePath = 'packages/cli/__tests__/zosfiles/__unit__/compare/testLocalFile.txt';
        const ussFilePath = "./testing2";
        // Vars populated by the mocked function
        let error;
        let apiMessage = "";
        let jsonObj:object;
        let logMessage = "";
        let fakeSession: object;
        // Mocks
        const getUSSFileSpy = jest.spyOn(Get, "USSFile");
        const getDiffStringSpy = jest.spyOn(DiffUtils, "getDiffString");
        const openDiffInbrowserSpy = jest.spyOn(DiffUtils, "openDiffInbrowser");
        const profFunc = jest.fn((args) => {
            return {
                host: "fake",
                port: "fake",
                user: "fake",
                password: "fake",
                auth: "fake",
                rejectUnauthorized: "fake",
            };
        });
        const processArguments = {
            arguments: {
                $0: "fake",
                _: ["fake"],
                localFilePath,
                ussFilePath,
                browserView: false,
                ...UNIT_TEST_ZOSMF_PROF_OPTS
            },
            response: {
                data: {
                    setMessage: jest.fn((setMsgArgs) => {
                        apiMessage = setMsgArgs;
                    }),
                    setObj: jest.fn((setObjArgs) => {
                        jsonObj = setObjArgs;
                    })
                },
                console: {
                    log: jest.fn((logArgs) => {
                        logMessage += logArgs;
                    })
                },
                progress: {
                    startBar: jest.fn((parms) => {
                        // do nothing
                    }),
                    endBar: jest.fn(() => {
                        // do nothing
                    })
                }
            },
            profiles: {
                get: profFunc
            }
        };

        beforeEach(()=> {
            getUSSFileSpy.mockReset();
            getUSSFileSpy.mockImplementation(jest.fn(async (session) => {
                fakeSession = session;
                return Buffer.from("compared");
            }));
            getDiffStringSpy.mockReset();
            getDiffStringSpy.mockImplementation(jest.fn(async () => {
                return "compared string";
            }));
            logMessage = "";
        });

        it("should compare local-file and uss-file in terminal", async () => {
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(processArguments as any);
            } catch (e) {
                error = e;
            }

            expect(getUSSFileSpy).toHaveBeenCalledTimes(1);
            expect(getUSSFileSpy).toHaveBeenCalledWith(fakeSession as any, ussFilePath, {
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Retrieving uss file"
                }
            });
            expect(apiMessage).toEqual("");
            expect(logMessage).toEqual("compared string");
            expect(getDiffStringSpy).toHaveBeenCalledTimes(1);
        });

        it("should compare local-file and uss-file in terminal with --context-lines option", async () => {
            const contextLinesArg: number = 2;
            const processArgCopy: any = {
                ...processArguments,
                arguments:{
                    ...processArguments.arguments,
                    contextLines: contextLinesArg
                }
            };
            const options: IDiffOptions = {
                contextLinesArg,
                outputFormat: "terminal"
            };

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(processArgCopy as any);
            } catch (e) {
                error = e;
            }

            expect(getUSSFileSpy).toHaveBeenCalledTimes(1);
            expect(getUSSFileSpy).toHaveBeenCalledWith(fakeSession as any, ussFilePath, {
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Retrieving uss file"
                }
            });
            expect(apiMessage).toEqual("");
            expect(logMessage).toEqual("compared string");
            expect(getDiffStringSpy).toHaveBeenCalledTimes(1);
            expect(getDiffStringSpy).toHaveBeenCalledWith(readFileSync(localFilePath).toString(), "compared", options);
        });

        it("should compare local-file and uss-file in terminal with --seqnum specified", async () => {
            const processArgCopy: any = {
                ...processArguments,
                arguments:{
                    ...processArguments.arguments,
                    seqnum: false,
                }
            };
            const options: IDiffOptions = {
                outputFormat: "terminal"
            };
            getUSSFileSpy.mockImplementation(jest.fn(async (session) => {
                fakeSession = session;
                return Buffer.from("compared12345678");
            }));
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(processArgCopy as any);
            } catch (e) {
                error = e;
            }

            expect(getUSSFileSpy).toHaveBeenCalledTimes(1);
            expect(getUSSFileSpy).toHaveBeenCalledWith(fakeSession as any, ussFilePath, {
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Retrieving uss file"
                }
            });
            expect(apiMessage).toEqual("");
            expect(logMessage).toEqual("compared string");
            expect(getDiffStringSpy).toHaveBeenCalledTimes(1);
            expect(getDiffStringSpy).toHaveBeenCalledWith("compared", "compared", options);
        });

        it("should compare local-file and uss-file in browser", async () => {
            openDiffInbrowserSpy.mockImplementation(jest.fn());
            processArguments.arguments.browserView = true ;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(processArguments as any);
            } catch (e) {
                error = e;
            }
            expect(openDiffInbrowserSpy).toHaveBeenCalledTimes(1);
        });
    });
});
