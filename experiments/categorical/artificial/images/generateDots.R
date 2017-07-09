library(ggplot2)
library(ggthemes)
makeDotGrid <- function(n) {
  d = data.frame(x = numeric(), y = numeric())
  for(x in seq(0, 1, length.out = n))
    for(y in seq(0, 1, length.out = n))
      d <- rbind(d, data.frame(x = x, y = y))
  
  ggplot(d, aes(x = x, y = y)) +
    geom_point(size = 25/n) + 
    theme_few() +
    theme(aspect.ratio = 1)
  
  ggsave(paste0('experiments/categorical/artificial/images/dotGrid', n, '.pdf'))
}

makeDotGrid(5)
makeDotGrid(15)
