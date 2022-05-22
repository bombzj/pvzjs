local filepath = "D:\\Users\\ZJ\\git\\pixijs\\pvz\\decode2\\IMAGES\\1200" --rainy.choosefolder()
print("input: " .. filepath)
local files = rainy.getfiles(filepath)
local newpath = rainy.formatpath(filepath .. "\\finished\\") 
print("output path: " .. newpath)
--rainy.newdir(newpath)

for i=1,#files do
    local file = files[i]
    print("output: " .. file)
    local outfile = rainy.getfilenamewithoutextension(files[i]) .. ".json"
    rainy.decodepam(file,newpath .. outfile);
end
