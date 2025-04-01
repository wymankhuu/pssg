#!/bin/bash

# Update all RL icons and colors
for grade in 1 2 3 4 5 6 7 8; do
  sed -i "s/id: '${grade}-rl',[^]*icon: 'menu_book',[^]*color: 'bg-primary-light',/id: '${grade}-rl',\n      title: 'Reading: Literature',\n      description: 'Narrative text standards',\n      icon: 'auto_stories',\n      color: 'bg-primary',/g" server/sampleData.ts
done

# Update all RI icons and colors
for grade in 1 2 3 4 5 6 7 8; do
  sed -i "s/id: '${grade}-ri',[^]*icon: 'article',[^]*color: 'bg-secondary',/id: '${grade}-ri',\n      title: 'Reading: Informational Text',\n      description: 'Non-fiction reading standards',\n      icon: 'description',\n      color: 'bg-secondary-dark',/g" server/sampleData.ts
done
