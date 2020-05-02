# Twitter Search Personalization Research

This repository contains assets that were used on research about personalization on Twitter Search.

Our article "Is There Personalization in Twitter Search? A Study on polarizedopinions about the Brazilian Welfare Reform" on (https://websci20.webscience.org/)[WebSci2020] was accepted. 

Structure:

- `datasets/daytrends`: dataset of daily Brazilian Twitter trending topics from `2019-02-01` to `2019-08-30`
- `datasets/training-data`: dataset of tweets for hashtags: #EuApoioANovaPrevidencia and #LutePelaSuaAposentadoria. From each, we extracted the top 100 profiles for #EuApoioANovaPrevidencia (`reforma_top_100_profiles_a_favor.json`) and #LutePelaSuaAposentadoria (`reforma_top_100_profiles_contra.json`) 
- `datasets/twitter-search-results`: dataset of the captures search results. Method for capturing were described on coming article and we use our tool (multiquerier-tool) based on Puppetter to capture these data.
   - `_dataset_1__en_pt-merged.json` contains the raw captured data
   - `exported_dataset_metrics.csv` contains the processed results we calculated metrics.
- `multiquerier-tool`: tool that we developed and used for instantiate agent, running the queries and capture results on Twitter


Contacts: jonatas.santos@uniriotec.br
