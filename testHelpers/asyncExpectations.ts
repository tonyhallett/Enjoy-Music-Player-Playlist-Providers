export async function expectAsyncError(fn:()=>Promise<any>,expectation:(e:any)=>any){
    var error;
    try{
        await fn();
    }catch(e){
        error=e;
    }
    expectation(error);
}
export async function expectAsyncErrorToBe(fn:()=>Promise<any>,expectation:any){
    return expectAsyncError(fn,(e)=>expect(e).toBe(expectation));
}