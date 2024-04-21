from flask import Flask, render_template, jsonify, request
import pandas as pd
from sklearn.manifold import MDS
import numpy as np
app = Flask(__name__)

df = pd.read_csv('static/whr_data/imputed_dataset_with_coords.csv')

@app.route('/')
def index():
    return render_template('index.html')


# Function to filter data based on year
def filter_data_by_year(year):
    return df[df['Year'] == year]

def filter_data_by_year_and_region(year, region):
    filtered_data = df[(df['Year'] == year) & (df['Region'] == region)]
    return filtered_data

@app.route('/data/year_region', methods=['GET'])
def get_data_by_year_and_region():
    year = request.args.get('year', default=None, type=int)
    region = request.args.get('region', default=None)
    
    if year is None or region is None:
        return jsonify({'error': 'Please provide both year and region parameters.'}), 400
    
    filtered_data = filter_data_by_year_and_region(year, region)
    return jsonify(filtered_data.to_dict(orient='records'))


# @app.route('/data/year_region', methods=['GET'])
# def get_data_by_year_and_region():
#     year = request.args.get('year', default=None, type=int)
#     region = request.args.get('region', default=None)
#     if year is None or region is None:
#         return jsonify([])  # Return an empty list if year or region is not provided

#     filtered_data = [entry for entry in df if entry['Year'] == year and entry['Region'] == region]
#     return jsonify(filtered_data)

@app.route('/regions', methods=['GET'])
def get_regions():
    regions = df['Region'].unique().tolist()  # Get unique values from the 'Region' column
    return jsonify(regions)

# Endpoint to get data for a specific year
@app.route('/data', methods=['GET'])
def get_data():
    year = request.args.get('year', default=2024, type=int)  # Default to 2024 if no year provided
    filtered_data = filter_data_by_year(year)
    return jsonify(filtered_data.to_dict(orient='records'))


@app.route("/aggregated_data")
def aggregated_data():
    # Group by year and region, calculate average health score
    aggregated_df = df.groupby(['Year', 'Region'])['Health'].mean().reset_index()
    
    # Convert DataFrame to dictionary
    aggregated_data = aggregated_df.to_dict(orient='records')
    
    return jsonify(aggregated_data)
@app.route('/count_by_region_and_year', methods=['GET'])
def count_by_region_and_year():
    # Get the year from the request parameters
    year = int(request.args.get('year', 2024))

    # Filter the data for the specified year
    filtered_data = df[df['Year'] == year]

    # Count the occurrences of each region
    region_counts = filtered_data['Region'].value_counts().to_dict()

    return jsonify(region_counts)

if __name__ == '__main__':
    app.run(debug=True)
