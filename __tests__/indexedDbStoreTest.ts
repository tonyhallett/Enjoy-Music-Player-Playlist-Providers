import "reflect-metadata";//need this even though not using the container
import { IndexedDbStore, } from "../entities";

declare var global:any;



var mockOpenRequest;
var mockIndexedDB={
    open:jest.fn(()=>{
        return mockOpenRequest;
    })
}
global.indexedDB=mockIndexedDB;

describe('IndexedDbStore',()=>{
    beforeEach(()=>{
        jest.clearAllMocks();
        mockOpenRequest={
            onsuccess:null,
            onerror:null,
        
            result:null,
            error:null
        }
    })
    
    describe('openAsync',()=>{
        function completeRequest(success){
            if(success){
                mockOpenRequest.result={};
                mockOpenRequest.onsuccess()
            }else{
                mockOpenRequest.error={};
                mockOpenRequest.onerror();
            }
        }
        [true,false].forEach(success=>{
        it('promisfies indexedDb.open',async ()=>{
                var indexedDbStore=new IndexedDbStore();
                var dbName="dbname";
                var openPromise= indexedDbStore.openAsync(dbName);
                
                completeRequest(success);
                expect(mockIndexedDB.open).toHaveBeenCalledWith(dbName);
                var database;
                var error;
                try{
                    database=await openPromise;
                }catch(e){
                    error=e;
                }
                if(success){
                    expect(database).toBe(mockOpenRequest.result);
                }else{
                    expect(error).toBe(mockOpenRequest.error);
                }
            });
        })
    })
    describe('transactionAsync',()=>{
        type transactionOpType="oncomplete"|"onerror"|"onabort";
        ["oncomplete","onerror","onabort"].forEach((op:transactionOpType)=>{
            it('should promisfy creating a transaction for the database with given storeNames and mode and initialize it',async ()=>{
                function finishTransaction(operation:transactionOpType){
                    if(operation=="onerror"){
                        mockTransaction.error={};
                    }
                    mockTransaction[operation]();
                }
                var indexedDbStore=new IndexedDbStore();
                var mockTransaction={
    
                } as any;
                var mockDatabase={
                    transaction:jest.fn().mockReturnValue(mockTransaction)
                }
                var transactionCallback=jest.fn();
                var resultPromise=indexedDbStore.transactionAsync(mockDatabase as any,["store1","store2"],"readonly",transactionCallback);
                expect(transactionCallback.mock.calls[0][0]).toBe(mockTransaction);
                finishTransaction(op);
                var result;
                var error;
                try{
                    result = await resultPromise;
                }catch(e){
                    error=e;
                }
                switch(op){
                    case "onerror":
                        expect(error).toBe(mockTransaction.error);
                        break;
                    case "oncomplete":
                        expect(result).toBe(true);
                        break;
                    case "onabort":
                        expect(result).toBe(false);
                        break;
                }
                
    
            })
        });
        
    })
    describe('savePlaylist',()=>{
        it('should open the EMP database and add the playlist to the playlists object store',async ()=>{
            var indexedDbStore=new IndexedDbStore();
            var mockDatabase={}
            var spiedOpenAsync=jest.spyOn(indexedDbStore,"openAsync").mockImplementation(()=>{
                return Promise.resolve(mockDatabase);
            });
            
            var mockObjectStore={
                add:jest.fn()
            }
            var mockTransaction={
                objectStore:jest.fn().mockReturnValue(mockObjectStore)
            }
            var spiedTransactionAsync=jest.spyOn(indexedDbStore,"transactionAsync").mockImplementation((database, storeNames, mode, transactionCallback)=>{
                transactionCallback(mockTransaction);
                return Promise.resolve();
            });
            var mockPlaylist={};
            await indexedDbStore.savePlaylist(mockPlaylist as any);
            
            expect(spiedOpenAsync).toHaveBeenCalledWith("EMP");
            expect(spiedTransactionAsync).toHaveBeenCalledWith(mockDatabase,"playlists", "readwrite",expect.any(Function));
            expect(mockTransaction.objectStore).toHaveBeenCalledWith("playlists");
            expect(mockObjectStore.add).toHaveBeenCalledWith(mockPlaylist);
        })
    })
})