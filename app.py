from flask import Flask, render_template, jsonify, request
import pandas as pd
from sklearn.manifold import MDS
import numpy as np
app = Flask(__name__)

# df = pd.read_csv('static/whr_data/imputed_dataset_with_coords.csv')

df = pd.read_csv('static/whr_data/df_merged.csv')
df = df.dropna()
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/years')
def get_years():
    years = ['Select Year'] + list(range(2024, 2014, -1))  # Years from 2024 to 2015
    return {'years': list(years)}

@app.route('/countries')
def get_countries():
    countries = ['Select Country'] + sorted(df['Country'].unique())
    return {'countries': list(countries)}

@app.route('/regions')
def get_regions():
    regions = ['Select Region'] + sorted(df['Region'].unique())
    return {'regions': list(regions)}

# Function to filter data based on year
def filter_data_by_year(year):
    return df[df['Year'] == year]

# Endpoint to get data for a specific year
@app.route('/data', methods=['GET'])
def get_data():
    year = request.args.get('year', default=2024, type=int)  # Default to 2024 if no year provided
    filtered_data = filter_data_by_year(year)
    return jsonify(filtered_data.to_dict(orient='records'))

@app.route('/get_country_region_year')
def get_country_region_year():
    selected_country = request.args.get('country')
    selected_region = request.args.get('region')
    selected_year = request.args.get('year')
    
    filtered_data = df.copy()
    
    if selected_country:
        filtered_data = filtered_data[filtered_data['Country'] == selected_country]
    elif selected_region:
        filtered_data = filtered_data[filtered_data['Region'] == selected_region]
    elif selected_year:
        filtered_data = filtered_data[filtered_data['Year'] == int(selected_year)]
    
    return jsonify(filtered_data.to_dict(orient='records'))

@app.route('/pcp_data')
def pcp_data():
    year = request.args.get('year', default=2024, type=int)  # Default to 2024 if no year provided
    filtered_data = filter_data_by_year(year)
    # Assuming df is a global variable or defined elsewhere
    data = filtered_data[['Country', 'Region', 'Happiness Rank', 'Ladder score', 'Economy',
               'Social support', 'Health', 'Freedom', 'Trust', 'Generosity',
               'Dystopia Residual']].to_dict(orient='records')
    return jsonify(data)

@app.route('/stacked_area_data')
def get_stacked_area_data():
    # Group data by year
    grouped_data = df.groupby('Year')
    
    processed_data = []
    for year, group in grouped_data:
        # Calculate the cumulative sum of each category
        group['Economy_cumsum'] = group['Economy'].cumsum()
        group['Social_support_cumsum'] = group['Social support'].cumsum()
        group['Health_cumsum'] = group['Health'].cumsum()
        group['Freedom_cumsum'] = group['Freedom'].cumsum()
        group['Trust_cumsum'] = group['Trust'].cumsum()
        group['Generosity_cumsum'] = group['Generosity'].cumsum()
        group['Dystopia_Residual_cumsum'] = group['Dystopia Residual'].cumsum()
        
        # Selecting the last row of each group
        last_row = group.iloc[-1]
        
        # Appending the last row to processed_data
        processed_data.append({
            'year': year,
            'Economy': last_row['Economy_cumsum'],
            'Social_support': last_row['Social_support_cumsum'],
            'Health': last_row['Health_cumsum'],
            'Freedom': last_row['Freedom_cumsum'],
            'Trust': last_row['Trust_cumsum'],
            'Generosity': last_row['Generosity_cumsum'],
            'Dystopia_Residual': last_row['Dystopia_Residual_cumsum']
        })
    
    return jsonify({"data": processed_data})


if __name__ == '__main__':
    app.run(debug=True, port=8970)





# # Function to filter data based on year
# def filter_data_by_year(year):
#     return df[df['Year'] == year]

# def filter_data_by_year_and_region(year, region):
#     filtered_data = df[(df['Year'] == year) & (df['Region'] == region)]
#     return filtered_data

# @app.route('/data/year_region', methods=['GET'])
# def get_data_by_year_and_region():
#     year = request.args.get('year', default=None, type=int)
#     region = request.args.get('region', default=None)
    
#     if year is None or region is None:
#         return jsonify({'error': 'Please provide both year and region parameters.'}), 400
    
#     filtered_data = filter_data_by_year_and_region(year, region)
#     return jsonify(filtered_data.to_dict(orient='records'))


# # @app.route('/data/year_region', methods=['GET'])
# # def get_data_by_year_and_region():
# #     year = request.args.get('year', default=None, type=int)
# #     region = request.args.get('region', default=None)
# #     if year is None or region is None:
# #         return jsonify([])  # Return an empty list if year or region is not provided

# #     filtered_data = [entry for entry in df if entry['Year'] == year and entry['Region'] == region]
# #     return jsonify(filtered_data)

# @app.route('/regions', methods=['GET'])
# def get_regions():
#     regions = df['Region'].unique().tolist()  # Get unique values from the 'Region' column
#     return jsonify(regions)

# # Endpoint to get data for a specific year
# @app.route('/data', methods=['GET'])
# def get_data():
#     year = request.args.get('year', default=2024, type=int)  # Default to 2024 if no year provided
#     filtered_data = filter_data_by_year(year)
#     return jsonify(filtered_data.to_dict(orient='records'))


# @app.route("/aggregated_data")
# def aggregated_data():
#     # Group by year and region, calculate average health score
#     aggregated_df = df.groupby(['Year', 'Region'])['Health'].mean().reset_index()
    
#     # Convert DataFrame to dictionary
#     aggregated_data = aggregated_df.to_dict(orient='records')
    
#     return jsonify(aggregated_data)
# @app.route('/count_by_region_and_year', methods=['GET'])
# def count_by_region_and_year():
#     # Get the year from the request parameters
#     year = int(request.args.get('year', 2024))

#     # Filter the data for the specified year
#     filtered_data = df[df['Year'] == year]

#     # Count the occurrences of each region
#     region_counts = filtered_data['Region'].value_counts().to_dict()

#     return jsonify(region_counts)
# @app.route('/pcp_data')
# def get_pcp_data():
#     df = pd.read_csv('static/whr_data/merged_data.csv')
#     df = df[['Country', 'Region', 'Happiness Rank', 'Ladder score', 'Economy',
#        'Social support', 'Health', 'Freedom', 'Trust', 'Generosity']]
#     sampled_df = df.groupby('Region').apply(lambda x: x.sample(3))
#     sampled_df = sampled_df.reset_index(drop=True)
#     sampled_df
#     return jsonify(sampled_df.to_dict(orient='records'))