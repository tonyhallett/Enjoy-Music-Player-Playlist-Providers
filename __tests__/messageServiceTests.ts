import "reflect-metadata";//need this even though not using the container
import { MessageService, } from "../entities";
import {  MessageIcons } from "../interfaces";

declare var global:any;

var errorIconUrl="errorIconUrl";
var successIconUrl="successIconUrl";
var messageIcons:MessageIcons={
    errorPath:"errorPath",
    successPath:"successPath"
}
var getURL=jest.fn((iconPath:string)=>{
    return iconPath==messageIcons.errorPath?errorIconUrl:successIconUrl;
});

var boundClose=jest.fn();
var notificationCtor=jest.fn(()=>{
    return {
        close:{
            bind:jest.fn().mockReturnValue(boundClose)
        }
    }
});

global.chrome={
    runtime:{
        getURL:getURL
    }
}
global.Notification=notificationCtor;


describe('MessageService',()=>{
    beforeEach(()=>{
        jest.clearAllMocks();
    });
    it('should get urls when constructed',()=>{
        var messageService=new MessageService({timeout:0},messageIcons);
        expect(getURL).toHaveBeenCalledWith(messageIcons.errorPath);
        expect(getURL).toHaveBeenCalledWith(messageIcons.successPath);
    });
    
    it('shows notification with title',async ()=>{
        var messageService=new MessageService({timeout:0},messageIcons);
        var messageTitle="some title";
        await messageService.show(true,messageTitle,"");
        expect(notificationCtor.mock.calls[0][0]).toBe(messageTitle);
    });
    describe('notification body',()=>{
        function bodyExpectation(expectedValue:string){
            expect(notificationCtor.mock.calls[0][1].body).toBe(expectedValue);
        }
        it('should be empty string if undefined ( or null )',async ()=>{
            var messageService=new MessageService({timeout:1000},messageIcons);
            await messageService.show(true,"",undefined);
            bodyExpectation("");
        });
        
        it('should be the string if passed a string',async ()=>{
            var messageService=new MessageService({timeout:1000},messageIcons);
            var body="The body";
            await messageService.show(true,"",body);
            bodyExpectation(body);
        });
        it('should be the message property if exists',async ()=>{
            var messageService=new MessageService({timeout:1000},messageIcons);
            var body={
                message:"The message"
            }
            await messageService.show(true,"",body);
            bodyExpectation(body.message);
        });
        it('should be empty string if object with no message property',async ()=>{
            var messageService=new MessageService({timeout:1000},messageIcons);
            await messageService.show(true,"",{});
            bodyExpectation("");
        });

    });
    [true,false].forEach((success)=>{
        it('shows notification with success or error icon',async ()=>{
            var messageService=new MessageService({timeout:0},messageIcons);
            await messageService.show(success,"","");
            expect(notificationCtor.mock.calls[0][1].icon).toBe(success?successIconUrl:errorIconUrl);
        })
    });
    it('should bind close to the notification and call it when timeout',async ()=>{
        jest.useFakeTimers();
        var timeout=1000;
        var messageService=new MessageService({timeout:timeout},messageIcons);
        var promise = messageService.show(true,"","");
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function),timeout);
        jest.runAllTimers();
        await promise;
        expect(boundClose).toHaveBeenCalled();
    })
})