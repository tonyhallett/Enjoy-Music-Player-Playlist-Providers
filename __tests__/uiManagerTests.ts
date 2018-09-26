import "reflect-metadata";//need this even though not using the container
import { UIManager, MessageService } from "../entities";
import { IMessageService, UIInjectorTimeoutDetails } from "../interfaces";
import { expectAsyncErrorToBe } from "../testHelpers/asyncExpectations";

declare var global:any;


class MockDate{
    private static times:number[];
    private static getTimeCounter=0;
    getTime(){
        return MockDate.times[MockDate.getTimeCounter++];
    }
    static setTimes(times:number[]){
        MockDate.times=times;
        MockDate.getTimeCounter=0;;
    }
}
global.Date=MockDate;

var domReady;
var mockUIInjector={
    domReady:jest.fn(()=>{
        return domReady;
    }),
    inject:jest.fn()
}
var mockMessageService:IMessageService={
    show:jest.fn().mockReturnValue(Promise.resolve(undefined))
}


describe('UIManager', () => {
    beforeEach(()=>{
        MockDate.setTimes([]);
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useFakeTimers();
    })
    function expectClearInterval(){
        expect(clearInterval).toHaveBeenCalled();
    }
    function expectCallbackTimes(num:number){
        expect(mockUIInjector.domReady.mock.calls.length).toBe(num);
    }
    it('should setInterval with provided interval',()=>{
        domReady=true;
        var interval=1000;
        var uiManager=new UIManager(mockUIInjector,null,interval,null,null);
        var promise= uiManager.addNewPlaylistProviders(null);
        jest.runAllTimers();
        expect(setInterval).toHaveBeenCalledWith(expect.any(Function),interval);
    });
    describe('dom ready',()=>{
        it('should delegate to the ui injector',async ()=>{
            domReady=true;
            var mockPlaylistProviderDetails={};
            var uiManager=new UIManager(mockUIInjector,null,0,null,null);
            var promise= uiManager.addNewPlaylistProviders(mockPlaylistProviderDetails as any);
            jest.runAllTimers();
            await promise;
            expect(mockUIInjector.domReady).toHaveBeenCalled();
            expect(mockUIInjector.inject.mock.calls[0][0]).toBe(mockPlaylistProviderDetails);
            expectClearInterval();
        })
    })
    describe('dom not ready',()=>{
        describe('and timout not elapsed',()=>{
            it('should run the interval again', ()=>{
                domReady=false;
                MockDate.setTimes([0,50]);
                var mockMessageService={
                    show:function(){return Promise.resolve(undefined)}
                }
                var interval=50;
                var uiManager=new UIManager(mockUIInjector,mockMessageService,interval,{timeout:100} as any,null);
                var promise = uiManager.addNewPlaylistProviders(null);
                jest.runTimersToTime(100);
                expectCallbackTimes(2);
            })
        });
        describe('and timout elapsed',()=>{
            
            it('should call the message service and reject', async ()=>{
                domReady=false;
                MockDate.setTimes([0,3000]);
                
                var timeoutDetails:UIInjectorTimeoutDetails={
                    timeout:2000,
                    timoutMessageTitle:"Timed out",
                    timeoutMessageBody:"Yes it did"
                }
                async function timeoutEllapsed(){
                    var uiManager=new UIManager(mockUIInjector,mockMessageService,0,timeoutDetails,null);
                    var promise = uiManager.addNewPlaylistProviders(null);
                    jest.runAllTimers();
                    return promise;
                }
                await expectAsyncErrorToBe(timeoutEllapsed,timeoutDetails.timoutMessageTitle);
                
                expectCallbackTimes(1);
                expect(mockMessageService.show).toHaveBeenCalledWith(false,timeoutDetails.timoutMessageTitle,timeoutDetails.timeoutMessageBody);
                expectClearInterval();
            })
        })
    })
    describe('unexpected error handling',()=>{
        var mockUnexpectedErrorMessage="Unexpected error";
        var mockThrownError={};
        var thrower={
            domReady:function(){
                throw mockThrownError;
            }
        }

    
        it('should show an error message and reject',async ()=>{
            var uiManager=new UIManager(thrower as any,mockMessageService,0,null,mockUnexpectedErrorMessage);
            async function throwUnexpectedError(){
                var p= uiManager.addNewPlaylistProviders(null);
                jest.runAllTimers();
                return p;
            }
            
            await expectAsyncErrorToBe(throwUnexpectedError,mockUnexpectedErrorMessage);
            expect(mockMessageService.show).toHaveBeenCalledWith(false,mockUnexpectedErrorMessage,mockThrownError);
            expectClearInterval();
        })
        
    
        
    })
});