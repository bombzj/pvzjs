local filepath = rainy.choosefolder()
print("input: " .. filepath)
local files = rainy.getfiles(filepath)
local newpath = rainy.formatpath(filepath .. "\\..\\finished\\") 
print("output path: " .. newpath)
--rainy.newdir(newpath)

for i=1,#files do
    local file = files[i]

    local a = string.reverse(string.gsub(file,filepath,'',1))
    local b = string.find(a,'\\')
    local c = string.find(a,'\\', b+1)
    --local outfile = string.reverse(string.sub(a,0,b) ..  string.sub(a,c+1) ) .. ".json"
    local outfile = rainy.getfilenamewithoutextension(files[i]) .. ".json"
    print("output: " .. outfile)
    rainy.decodepam(file,newpath .. outfile);
end





local filepath = rainy.choosefolder()
print("input: " .. filepath)
local files = rainy.getfiles(filepath)
local newpath = rainy.formatpath(filepath .. "\\..\\finished\\") 
print("output path: " .. newpath)
--rainy.newdir(newpath)

for i=1,#files do
    local outfile = string.lower(string.gsub(string.gsub(files[i], filepath .. "\\", ""), "\\", "_")) .. '.json'

    -- local a = string.reverse(string.gsub(file,filepath,'',1))
    -- local b = string.find(a,'\\')
    -- local c = string.find(a,'\\', b+1)
    --local outfile = string.reverse(string.sub(a,0,b) ..  string.sub(a,c+1) ) .. ".json"
    -- local outfile = rainy.getfilenamewithoutextension(files[i]) .. ".json"
    print("output: " .. outfile)
    rainy.decoderton(files[i],newpath .. outfile,0)
end
