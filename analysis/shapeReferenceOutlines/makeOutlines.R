library(dplyr)
library(Momocs)
library(readr)
setwd("~/Repos/reference_games/analysis/")

# Import data from shape experiment
clks = read.csv("../data/shapeReference/clickedObj/shapeReferenceClickedObj.csv") %>%
  rename(clkTime = time) 

# Turn all stimuli into jpgs; make them big so that the very 
# thin outlines can still be detected... 
multiplier <- 5
edgeLength <- multiplier * 300

for(rowNum in 1:dim(clks)[1]) {
  row <- clks[rowNum,]
  xpoints = multiplier * row[c(5,7,9,11)]
  # Need to flip the y coords
  ypoints = multiplier * (300 - row[c(6,8,10,12)])
  jpeg(paste(c("shapeReferenceOutlines/jpgs/example", rowNum, ".jpg"), collapse = ''), 
       width = edgeLength, height = edgeLength, units = 'px')
  plot(1, type="n", xlim=c(0, edgeLength), ylim=c(0, edgeLength), 
       ann = F, axes = F)
  xspline(x = xpoints, y = ypoints, open = F, shape = -1, col = 'black')
  dev.off()
}

# Extract outlines from jpgs
lf <- list.files('shapeReferenceOutlines/jpgs', full.names=TRUE)

ex <- Out(import_jpg(lf, verbose = F))

# Test version:
# ex_test <- Out(import_jpg(paste("shapeReferenceOutlines/jpgs/example", 1:25, ".jpg", sep = ""), verbose = F))

# Check for examples with sketchy extraction (e.g. if it couldn't find outline)
for(name in names(ex$coo)) {
  numPoints <- length(unlist(ex$coo[name]))/2
  if(numPoints < 100) {
    print(name)
  }
}

# Align axes, so that PCA doesn't just classify based on orientation
ex_aligned <- coo_aligncalliper(ex)

# Check roughly how many harmonics you need to get 99% power;
# Warning: if this number is too high, you'll overfit 
calibrate_harmonicpower(ex_aligned, method = 'efourier', nb.h = 50)

# Perform fourier transform w/ that # of harmonics
exF <- efourier(ex_aligned, nb.h = 7, norm = F)

# Run PCA
exPCA <- exF %>% PCA()

# Plot PCA with different axes... 
plot(exPCA, xax = 1, yax = 2, amp.shp = 3, points = T)
plot(exPCA, xax = 1, yax = 3, amp.shp = 5, points = F)
plot(exPCA, xax = 2, yax = 3, amp.shp = 5, points = T)

# Make cluster plot to see coarse structure... 
CLUST(exPCA, method = "phylogram")

# Get clusters
retain <- scree_min(exPCA, prop = .99)

phylo <- exPCA$x[, 2:7] %>%
  dist(method = "manhattan") %>%
  hclust(method = "ward.D2")
  
# Add cluster cols
newClks = clks %>% 
  cbind(clustL4 = cutree(phylo, k = 4)) %>%
  cbind(clustL5 = cutree(phylo, k = 5)) %>%
  cbind(clustL10 = cutree(phylo, k = 10)) %>%
  cbind(clustL20 = cutree(phylo, k = 20)) %>%
  cbind(clustL30 = cutree(phylo, k = 30)) %>%
  cbind(clustL40 = cutree(phylo, k = 40)) %>%
  cbind(clustL50 = cutree(phylo, k = 50)) %>%
  cbind(clustL100 = cutree(phylo, k = 100)) %>%
  cbind(clustL200 = cutree(phylo, k = 200))
  
table(newClks$clustL100)

write_csv(newClks, "../data/shapeReference/clickedObj/clksWithPhylo.csv")

# Plot avg shape in some clusters... 1
subGroup <- Out(ex_aligned$coo[newClks$clustL100 == 1])
panel(subGroup)
  