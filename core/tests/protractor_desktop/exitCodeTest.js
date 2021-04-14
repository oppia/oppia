describe("Protractor Testing", function(){
 
    beforeAll(function(){
        expect(100).toBe(100);
        console.log("beforeAll");
    });
 
    beforeEach(function(){
        expect(200).toBe(200);
        console.log("beforeEach");
    })
 
    it("should test 1",async function(){
        await expect(true).toBe(true);
        await expect(500).toBe(500);
    });
 
    it("should test 2",async function(){
 
        await expect(true).toBe(true);
        await expect(1000).toBe(1000);
    });
 
    it("should test 3",async function(){
 
        await expect(false).toBe(false);
        await expect(1500).toBe(1500);
    });
 
    afterEach(function(){
        expect(300).toBe(300);
        console.log("afterEach");
    })
 
    afterAll(function(){
        expect(100).toBe(200);
    })
});
