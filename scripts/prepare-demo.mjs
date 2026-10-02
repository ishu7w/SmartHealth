import {mkdir,writeFile} from "node:fs/promises";
import {request} from "../frontend/node_modules/@playwright/test/index.mjs";
const baseURL=process.env.APP_URL||"http://localhost:8080";
if(!process.env.E2E_ADMIN_EMAIL||!process.env.E2E_ADMIN_PASSWORD)throw new Error("Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD for your demo server");
const client=await request.newContext({baseURL});
try {
  let token=await (await client.get("/api/auth/csrf")).json();
  const auth=await client.post("/api/auth/login",{form:{username:process.env.E2E_ADMIN_EMAIL,password:process.env.E2E_ADMIN_PASSWORD},headers:{[token.headerName]:token.token}});
  if(!auth.ok())throw new Error("Administrator sign-in failed");
  token=await (await client.get("/api/auth/csrf")).json();
  async function post(path,data){const response=await client.post(path,{data,headers:{[token.headerName]:token.token}});if(!response.ok())throw new Error(`${path}: ${response.status()} ${await response.text()}`);return response.json();}
  console.log((await post("/api/admin/demo",{})).message);
  const runs=[];
  for(const numberOfRecords of [100,500,1000,5000,10000]){const run=await post("/api/process/compare",{numberOfRecords,threadCount:4,seed:42});runs.push(run.summary);console.log(`${numberOfRecords} records: sequential ${run.summary.sequentialTime.toFixed(3)} ms, parallel ${run.summary.parallelTime.toFixed(3)} ms, speedup ${run.summary.speedup.toFixed(2)}x`);}
  await mkdir("demo-output",{recursive:true});
  await writeFile("demo-output/benchmarks.json",JSON.stringify({generatedAt:new Date().toISOString(),system:await (await client.get("/api/process/system")).json(),runs},null,2));
  const fields=["numberOfRecords","threadCount","seed","sequentialTime","parallelTime","speedup","timeSaved"];
  await writeFile("demo-output/benchmarks.csv",[fields.join(","),...runs.map(r=>fields.map(k=>r[k]).join(","))].join("\n"));
  console.log("Saved measured results to demo-output/.");
}finally{await client.dispose();}
