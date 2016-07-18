# Import data from shape experiment
clks = read.csv("../data/shapeReference/clickedObj/shapeReferenceClickedObj.csv") %>%
  rename(clkTime = time) 

# Turn all stimuli into jpgs
multiplier <- 3
for(rowNum in 1:dim(clks)[1]) {
  row <- clks[rowNum,]
  xpoints = multiplier * row[c(5,7,9,11)]
  ypoints = multiplier * (300 - row[c(6,8,10,12)])
  jpeg(paste(c("shapeReferenceOutlines/jpgs/example", rowNum, ".jpg"), collapse = ''), 
       width = multiplier * 300, height = multiplier * 300, units = 'px')
  plot(1, type="n", xlim=c(0, multiplier * 300), ylim=c(0, multiplier * 300), 
       ann = F, axes = F)
  xspline(x = xpoints, y = ypoints, open = F, shape = -1, col = 'black')
  dev.off()
}

# Extract outlines from jpgs
lf <- list.files('shapeReferenceOutlines/jpgs', full.names=TRUE)

ex <- Out(import_jpg(lf, verbose = F))

# Remove examples where too few points were detected
# (TODO: fix the extraction of points in the first place)

for(name in names(ex$coo)) {
  numPoints <- length(unlist(ex$coo[name]))/2
  if(numPoints < 100) {
    #print(numPoints)
    print(name)
  }
}

ex$coo$example285 <- NULL
ex$coo$example2986 <- NULL

# Run fourier
exF <- efourier(ex, nb.h = 4)
exPCA <- exF %>% PCA()

plot(exPCA)

# Get clusters
retain <- scree_min(exPCA, .99)

phylo <- exPCA$x[, retain] %>%
  dist(method = "euclidean") %>%
  hclust(method = "complete") %>%
  cutree(k = 5)
