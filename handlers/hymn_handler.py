import pandas as pd


class HymnHandler:
    def __init__(self, excel_path):
        try:
            # Load Excel file
            self.df = pd.read_excel(
                excel_path,
                dtype={
                    'Hymn number': int
                }
            )
            print("Hymns data loaded successfully")
            print(f"Total hymns: {len(self.df)}")
            print(f"Available columns: {self.df.columns.tolist()}")

            # Clean column names (remove trailing spaces)
            self.df.columns = self.df.columns.str.strip()

            # Map misspelled column names to correct ones
            column_mapping = {
                'Hymn ': 'Hymn',
                'Fouth': 'Fourth',
                'Firth': 'Fifth',
                'Nineth': 'Ninth'
            }
            self.df = self.df.rename(columns=column_mapping)

            # Verify the required columns exist
            required_columns = {'Hymn number', 'Hymn'}
            missing_columns = required_columns - set(self.df.columns)
            if missing_columns:
                raise ValueError(f"Missing required columns: {missing_columns}")

        except FileNotFoundError:
            print(f"Error: Hymns Excel file not found at {excel_path}")
            raise
        except Exception as e:
            print(f"Error loading Hymns Excel: {e}")
            raise

    def process_hymn(self, hymn_data):
        """Process hymn data into structured format with verses."""
        try:
            # List of possible verse column names (corrected spelling)
            verse_columns = ['First', 'Second', 'Third', 'Fourth', 'Fifth',
                             'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth']

            # Process verses
            verses = []
            for i, col in enumerate(verse_columns, 1):
                if col in hymn_data and pd.notna(hymn_data[col]) and str(hymn_data[col]).strip():
                    verses.append({
                        'number': i,
                        'text': str(hymn_data[col]).strip()
                    })

            # Detect if there's a chorus (repeating verses)
            chorus = None
            for i, verse in enumerate(verses):
                if any(v['text'] == verse['text'] for v in verses[i + 1:]):
                    chorus = verse['text']
                    # Remove chorus from verses
                    verses = [v for v in verses if v['text'] != chorus]
                    break

            return {
                'number': int(hymn_data['Hymn number']),
                'title': hymn_data['Hymn'].strip() if isinstance(hymn_data['Hymn'], str) else str(hymn_data['Hymn']),
                'verses': verses,
                'chorus': chorus,
                'total_verses': len(verses)
            }
        except Exception as e:
            print(f"Error processing hymn: {e}")
            return None

    def search_hymns(self, search_term=''):
        """Search hymns by number or title."""
        try:
            if not search_term:
                hymns = self.df
            else:
                hymns = self.df[
                    self.df['Hymn'].str.lower().str.contains(search_term.lower()) |
                    self.df['Hymn number'].astype(str).str.contains(search_term)
                    ]

            results = []
            for _, hymn in hymns.iterrows():
                processed_hymn = self.process_hymn(hymn)
                if processed_hymn:
                    results.append(processed_hymn)

            return sorted(results, key=lambda x: x['number'])
        except Exception as e:
            print(f"Error searching hymns: {e}")
            return []

    def get_hymn(self, hymn_number):
        """Get a specific hymn by number."""
        try:
            hymn = self.df[self.df['Hymn number'] == hymn_number]
            if hymn.empty:
                return None
            return self.process_hymn(hymn.iloc[0])
        except Exception as e:
            print(f"Error fetching hymn {hymn_number}: {e}")
            return None